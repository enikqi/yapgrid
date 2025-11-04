import { prisma } from '@/lib/db/prisma'
import { promises as fs } from 'fs'
import path from 'path'
import { createLogger } from '@/lib/logger'
import { config } from '@/lib/config'

const logger = createLogger('cleanup')

export class CleanupService {
  private mediaDir: string
  private tempDir: string

  constructor() {
    this.mediaDir = config.MEDIA_DIR || './media'
    this.tempDir = path.join(process.cwd(), 'temp')
  }

  /**
   * Remove failed download attempts older than specified hours
   */
  async removeOldFailedPosts(olderThanHours = 1): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - olderThanHours)

      const result = await prisma.post.deleteMany({
        where: {
          status: 'FAILED',
          processedAt: {
            lt: cutoffDate,
          },
        },
      })

      if (result.count > 0) {
        logger.info('Removed old failed posts', { count: result.count, olderThanHours })
      }

      return result.count
    } catch (error) {
      logger.error('Failed to remove old failed posts', error)
      return 0
    }
  }

  /**
   * Clean up temporary cookie files
   */
  async cleanupTempCookieFiles(): Promise<number> {
    try {
      const files = await fs.readdir(this.tempDir)
      let cleanedCount = 0

      for (const file of files) {
        if (file.startsWith('cookies_') && file.endsWith('.txt')) {
          const filePath = path.join(this.tempDir, file)
          try {
            await fs.unlink(filePath)
            cleanedCount++
            logger.debug('Deleted temp cookie file', { file })
          } catch (error) {
            logger.debug('Could not delete cookie file', { file })
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info('Cleaned up cookie files', { count: cleanedCount })
      }

      return cleanedCount
    } catch (error) {
      logger.error('Failed to cleanup cookie files', error)
      return 0
    }
  }

  /**
   * Clean up all temporary files older than specified hours
   */
  async cleanupAllTempFiles(olderThanHours = 1): Promise<number> {
    try {
      const files = await fs.readdir(this.tempDir)
      const now = Date.now()
      const maxAge = olderThanHours * 60 * 60 * 1000
      let cleanedCount = 0

      for (const file of files) {
        const filePath = path.join(this.tempDir, file)
        try {
          const stats = await fs.stat(filePath)
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath)
            cleanedCount++
            logger.debug('Deleted old temp file', { file })
          }
        } catch (error) {
          // Skip files that can't be accessed
          logger.debug('Could not process temp file', { file })
        }
      }

      if (cleanedCount > 0) {
        logger.info('Cleaned up temp files', { count: cleanedCount })
      }

      return cleanedCount
    } catch (error) {
      logger.error('Failed to cleanup temp files', error)
      return 0
    }
  }

  /**
   * Remove orphaned media files that don't have corresponding database records
   */
  async removeOrphanedMediaFiles(): Promise<number> {
    try {
      // Get all media files
      const files = await fs.readdir(this.mediaDir)
      let orphanedCount = 0

      for (const file of files) {
        // Extract post ID from filename (format: {postId}.{ext})
        const postIdMatch = file.match(/^([^.]+)\./)
        if (!postIdMatch) continue

        const postId = postIdMatch[1]

        // Check if asset exists in database
        const asset = await prisma.asset.findFirst({
          where: {
            pathOrKey: {
              contains: file,
            },
          },
        })

        if (!asset) {
          const filePath = path.join(this.mediaDir, file)
          try {
            await fs.unlink(filePath)
            orphanedCount++
            logger.debug('Deleted orphaned media file', { file })
          } catch (error) {
            logger.debug('Could not delete orphaned file', { file })
          }
        }
      }

      if (orphanedCount > 0) {
        logger.info('Removed orphaned media files', { count: orphanedCount })
      }

      return orphanedCount
    } catch (error) {
      logger.error('Failed to remove orphaned media files', error)
      return 0
    }
  }

  /**
   * Reset stuck posts that have been in "processing" state for too long
   */
  async resetStuckPosts(stuckThresholdMinutes = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setMinutes(cutoffDate.getMinutes() - stuckThresholdMinutes)

      // Find posts that are stuck in DOWNLOADING state
      const stuckPosts = await prisma.post.findMany({
        where: {
          status: 'DOWNLOADING',
          processedAt: {
            lt: cutoffDate,
          },
        },
      })

      if (stuckPosts.length === 0) {
        return 0
      }

      // Reset them to NEW status so they can be retried
      const result = await prisma.post.updateMany({
        where: {
          id: {
            in: stuckPosts.map((p) => p.id),
          },
        },
        data: {
          status: 'NEW',
          processedAt: null,
          error: 'Reset from stuck DOWNLOADING state',
        },
      })

      if (result.count > 0) {
        logger.info('Reset stuck posts', { count: result.count, stuckThresholdMinutes })
      }

      return result.count
    } catch (error) {
      logger.error('Failed to reset stuck posts', error)
      return 0
    }
  }

  /**
   * Run all cleanup operations
   */
  async runAllCleanup(): Promise<{
    failedPosts: number
    cookieFiles: number
    tempFiles: number
    orphanedMedia: number
    stuckPosts: number
  }> {
    logger.info('Running all cleanup operations...')

    const results = {
      failedPosts: await this.removeOldFailedPosts(1),
      cookieFiles: await this.cleanupTempCookieFiles(),
      tempFiles: await this.cleanupAllTempFiles(1),
      orphanedMedia: await this.removeOrphanedMediaFiles(),
      stuckPosts: await this.resetStuckPosts(30),
    }

    logger.info('Cleanup operations completed', results)

    return results
  }
}

// Singleton instance
export const cleanupService = new CleanupService()
