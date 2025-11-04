import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'
import { promises as fs } from 'fs'
import path from 'path'

const logger = createLogger('api/admin/cleanup')

// GET /api/admin/cleanup - Get cleanup status and statistics
export async function GET() {
  try {
    // Get database statistics
    const stats = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: 'FAILED' } }),
      prisma.post.count({ where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }), // Older than 30 days
      prisma.job.count({ where: { status: { in: ['COMPLETED', 'CANCELLED'] } } }),
      prisma.asset.count()
    ])

    const [totalPosts, failedPosts, oldPosts, completedJobs, totalAssets] = stats

    // Check media directory size
    let mediaDirSize = 0
    try {
      const mediaPath = path.join(process.cwd(), 'media')
      const files = await fs.readdir(mediaPath, { withFileTypes: true })
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(mediaPath, file.name)
          const stats = await fs.stat(filePath)
          mediaDirSize += stats.size
        }
      }
    } catch (error) {
      logger.warn('Could not calculate media directory size:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        database: {
          totalPosts,
          failedPosts,
          oldPosts,
          completedJobs,
          totalAssets
        },
        media: {
          directorySize: mediaDirSize,
          directorySizeFormatted: formatBytes(mediaDirSize)
        },
        cleanup: {
          canCleanupFailedPosts: failedPosts > 0,
          canCleanupOldPosts: oldPosts > 0,
          canCleanupCompletedJobs: completedJobs > 0,
          canCleanupMedia: mediaDirSize > 0
        }
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to get cleanup statistics')
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get cleanup statistics' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/admin/cleanup - Perform cleanup operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { 
      cleanupFailedPosts = true,
      cleanupOldPosts = false,
      cleanupCompletedJobs = false,
      cleanupMedia = true,
      olderThanDays = 30
    } = body

    // Use the new cleanup service for automatic cleanup
    const { cleanupService } = await import('@/lib/cleanup')
    const cleanupResults = await cleanupService.runAllCleanup()

    const results = {
      failedPostsDeleted: cleanupResults.failedPosts,
      oldPostsDeleted: 0,
      completedJobsDeleted: 0,
      mediaFilesDeleted: cleanupResults.orphanedMedia,
      mediaSizeFreed: 0,
      cookieFilesDeleted: cleanupResults.cookieFiles,
      tempFilesDeleted: cleanupResults.tempFiles,
      stuckPostsReset: cleanupResults.stuckPosts,
    }

    // Additional cleanup if requested
    if (cleanupOldPosts) {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
      
      const oldPosts = await prisma.post.findMany({
        where: { 
          createdAt: { lt: cutoffDate },
          status: { not: 'PUBLISHED' } // Keep published posts
        },
        select: { id: true, assets: { select: { pathOrKey: true } } }
      })

      for (const post of oldPosts) {
        // Delete associated assets
        for (const asset of post.assets) {
          try {
            const assetPath = path.join(process.cwd(), 'media', asset.pathOrKey)
            const stats = await fs.stat(assetPath)
            results.mediaSizeFreed += stats.size
            await fs.unlink(assetPath)
            results.mediaFilesDeleted++
          } catch (error) {
            logger.warn(`Could not delete asset ${asset.pathOrKey}:`, error)
          }
        }
      }

      const deleteResult = await prisma.post.deleteMany({
        where: { 
          createdAt: { lt: cutoffDate },
          status: { not: 'PUBLISHED' }
        }
      })
      results.oldPostsDeleted = deleteResult.count
    }

    // Cleanup completed jobs
    if (cleanupCompletedJobs) {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Keep jobs from last 7 days
      
      const deleteResult = await prisma.job.deleteMany({
        where: {
          status: { in: ['COMPLETED', 'CANCELLED'] },
          finishedAt: { lt: cutoffDate }
        }
      })
      results.completedJobsDeleted = deleteResult.count
    }

    logger.info({ results }, 'Database cleanup completed')

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        message: 'Database cleanup completed successfully',
        mediaSizeFreedFormatted: formatBytes(results.mediaSizeFreed)
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to perform cleanup')
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to perform cleanup' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
