import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { createLogger } from '@/lib/logger'
import { config } from '@/lib/config'

const logger = createLogger('media-downloader')

export interface MediaInfo {
  filename: string
  url: string
  type: 'video' | 'image' | 'gif'
  width?: number
  height?: number
  duration?: number
  size?: number
}

export class MediaDownloader {
  private tempDir: string
  private mediaDir: string
  private retryDelays = [2000, 5000, 10000] // 2s, 5s, 10s

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
    this.mediaDir = config.MEDIA_DIR || './media'
    this.ensureDirectories()
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
      await fs.mkdir(this.mediaDir, { recursive: true })
    } catch (error) {
      logger.error('Failed to create directories', error)
    }
  }

  /**
   * Download media from post URL with retry logic
   */
  async downloadMedia(post: any, postId: string): Promise<MediaInfo | null> {
    const url = post.url || post.permalink

    // Check if this is a text-only post
    if (this.isTextOnlyPost(post)) {
      logger.debug('Skipping text-only post', { postId })
      return null
    }

    // Try downloading with retries
    for (let attempt = 0; attempt < this.retryDelays.length; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(`Retry attempt ${attempt + 1} for post`, { postId })
          await this.delay(this.retryDelays[attempt - 1])
        }

        // Handle different media types
        if (url.includes('v.redd.it') || url.includes('/comments/')) {
          return await this.downloadRedditVideo(url, postId)
        } else if (url.includes('i.redd.it')) {
          return await this.downloadRedditImage(url, postId)
        } else if (url.includes('/gallery/')) {
          return await this.downloadRedditGallery(url, postId)
        } else {
          // Try generic download
          return await this.downloadGenericMedia(url, postId)
        }
      } catch (error) {
        const isLastAttempt = attempt === this.retryDelays.length - 1
        
        if (this.is403Error(error)) {
          logger.debug('HTTP 403 error - Reddit blocked request', { postId, url, attempt })
        } else if (this.isJsonParseError(error)) {
          logger.debug('Failed to parse JSON from yt-dlp', { postId, url, attempt })
        } else {
          logger.warn('Download attempt failed', { postId, url, attempt, error: error instanceof Error ? error.message : 'Unknown error' })
        }

        if (isLastAttempt) {
          logger.error('All download attempts failed', { postId, url, totalAttempts: this.retryDelays.length })
          return null
        }
      }
    }

    return null
  }

  /**
   * Download Reddit video using yt-dlp with better configuration
   */
  private async downloadRedditVideo(url: string, postId: string): Promise<MediaInfo | null> {
    const outputFilename = `${postId}.mp4`
    const tempPath = path.join(this.tempDir, outputFilename)
    const finalPath = path.join(this.mediaDir, outputFilename)

    // Use the URL as-is - yt-dlp handles v.redd.it URLs with proper extractor args
    const downloadUrl = url

    const cookieFile = path.join(this.tempDir, `cookies_${postId}.txt`)
    let cookieFileCreated = false

    try {
      // Create empty cookie file if needed
      if (config.REDDIT_SESSION_COOKIE) {
        await fs.writeFile(cookieFile, config.REDDIT_SESSION_COOKIE)
        cookieFileCreated = true
      }

      const ytdlpArgs = [
        downloadUrl,
        '-o', tempPath,
        '--format', 'bestvideo[height<=720]+bestaudio/best[height<=720]/best',
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '--no-warnings',
        '--quiet',
        '--print-json',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '--extractor-args', 'reddit:player_only=False',
        '--max-filesize', `${config.MAX_FILESIZE_MB}M`,
      ]

      // Add cookie file if it was created
      if (cookieFileCreated) {
        ytdlpArgs.push('--cookies', cookieFile)
      }

      logger.info('Starting video download with yt-dlp', { postId, url: downloadUrl })

      const result = await this.executeCommand('yt-dlp', ytdlpArgs)
      const metadata = JSON.parse(result)

      // Check duration limit
      if (metadata.duration && metadata.duration > config.MAX_DURATION_SECONDS) {
        throw new Error(`Video duration (${metadata.duration}s) exceeds maximum (${config.MAX_DURATION_SECONDS}s)`)
      }

      // Move to final location
      await fs.rename(tempPath, finalPath)

      // Get file stats
      const stats = await fs.stat(finalPath)

      logger.info('Video downloaded successfully', { postId, filename: outputFilename, size: stats.size })

      return {
        filename: outputFilename,
        url: `/api/media/${encodeURIComponent(outputFilename)}`,
        type: 'video',
        width: metadata.width || 1920,
        height: metadata.height || 1080,
        duration: metadata.duration || 0,
        size: stats.size,
      }
    } catch (error) {
      // Don't attempt fallback for 403 errors (blocked by Reddit)
      // For other errors, the retry logic in downloadMedia will handle it
      throw error
    } finally {
      // Clean up cookie file
      if (cookieFileCreated) {
        try {
          await fs.unlink(cookieFile)
        } catch (error) {
          logger.debug('Failed to clean up cookie file', { cookieFile })
        }
      }

      // Clean up temp file on error
      try {
        await fs.access(tempPath)
        await fs.unlink(tempPath)
      } catch {
        // File doesn't exist, that's fine
      }
    }
  }

  /**
   * Download Reddit image
   */
  private async downloadRedditImage(url: string, postId: string): Promise<MediaInfo | null> {
    const ext = path.extname(url) || '.jpg'
    const outputFilename = `${postId}${ext}`
    const finalPath = path.join(this.mediaDir, outputFilename)

    try {
      // Use yt-dlp for image download as well
      const ytdlpArgs = [
        url,
        '-o', finalPath,
        '--no-playlist',
        '--quiet',
      ]

      await this.executeCommand('yt-dlp', ytdlpArgs)

      const stats = await fs.stat(finalPath)

      logger.info('Image downloaded successfully', { postId, filename: outputFilename })

      return {
        filename: outputFilename,
        url: `/api/media/${encodeURIComponent(outputFilename)}`,
        type: 'image',
        size: stats.size,
      }
    } catch (error) {
      logger.warn('Failed to download image', { postId, url, error: error instanceof Error ? error.message : 'Unknown' })
      throw error
    }
  }

  /**
   * Download Reddit gallery (first image only)
   * Gallery posts are not currently supported and will be skipped
   */
  private async downloadRedditGallery(url: string, postId: string): Promise<MediaInfo | null> {
    logger.info('Gallery posts are not currently supported - this post will be skipped', { postId, url })
    // Galleries are skipped gracefully - they won't be marked as failed
    throw new Error('Gallery posts are not currently supported - this post will be skipped')
  }

  /**
   * Download generic media
   */
  private async downloadGenericMedia(url: string, postId: string): Promise<MediaInfo | null> {
    logger.debug('Generic media download', { postId, url })
    
    try {
      const ext = path.extname(url) || '.mp4'
      const outputFilename = `${postId}${ext}`
      const finalPath = path.join(this.mediaDir, outputFilename)

      const ytdlpArgs = [
        url,
        '-o', finalPath,
        '--no-playlist',
        '--quiet',
        '--print-json',
      ]

      const result = await this.executeCommand('yt-dlp', ytdlpArgs)
      const metadata = JSON.parse(result)

      const stats = await fs.stat(finalPath)

      // Detect media type based on file extension
      const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv']
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
      const extLower = ext.toLowerCase()
      
      const mediaType = videoExts.includes(extLower) ? 'video' : imageExts.includes(extLower) ? 'image' : 'video'

      logger.info('Generic media downloaded', { postId, filename: outputFilename, type: mediaType })

      return {
        filename: outputFilename,
        url: `/api/media/${encodeURIComponent(outputFilename)}`,
        type: mediaType,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        size: stats.size,
      }
    } catch (error) {
      logger.debug('Generic media download failed', { postId, url })
      throw error
    }
  }

  /**
   * Check if post is text-only
   */
  private isTextOnlyPost(post: any): boolean {
    const url = post.url || ''
    return (
      url.includes('/comments/') &&
      !url.includes('i.redd.it') &&
      !url.includes('v.redd.it') &&
      !url.includes('/gallery/') &&
      !post.preview
    )
  }

  /**
   * Execute command with promise wrapper
   */
  private executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args)
      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim())
        } else {
          const error = new Error(`${command} exited with code ${code}: ${stderr}`)
          ;(error as any).stderr = stderr
          ;(error as any).code = code
          reject(error)
        }
      })

      proc.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Check if error is a 403 error
   */
  private is403Error(error: any): boolean {
    if (!error) return false
    const errorStr = error.message || error.stderr || error.toString()
    return errorStr.includes('HTTP Error 403') || errorStr.includes('Blocked')
  }

  /**
   * Check if error is a JSON parse error
   */
  private isJsonParseError(error: any): boolean {
    if (!error) return false
    const errorStr = error.message || error.toString()
    return errorStr.includes('Failed to parse JSON') || errorStr.includes('Unexpected token')
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Clean up old temp files
   */
  async cleanupTempFiles(olderThanHours = 1): Promise<void> {
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
    } catch (error) {
      logger.error('Failed to cleanup temp files', error)
    }
  }
}
