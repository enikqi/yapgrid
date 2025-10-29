import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { config } from '@/lib/config'
import { createLogger } from '@/lib/logger'
import { saveFile } from '@/lib/storage'
import { generateVideoFileName, sanitizeFileName } from '@/lib/utils'

const logger = createLogger('video-downloader')

export interface DownloadResult {
  videoPath: string
  thumbnailPath?: string
  metadata: {
    width: number
    height: number
    duration: number
    filesize: number
    format: string
  }
}

export class VideoDownloader {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
    this.ensureTempDirectory()
  }

  private async ensureTempDirectory() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      logger.error({ error }, 'Failed to create temp directory')
    }
  }

  /**
   * Download video using yt-dlp
   * This handles Reddit's separate video/audio streams automatically
   */
  async downloadVideo(
    url: string,
    postId: string,
    options: {
      maxDuration?: number
      maxFilesize?: number
      targetHeight?: number
    } = {}
  ): Promise<DownloadResult> {
    const {
      maxDuration = config.MAX_DURATION_SECONDS,
      maxFilesize = config.MAX_FILESIZE_MB * 1024 * 1024,
      targetHeight = 720,
    } = options

    const outputFileName = generateVideoFileName(postId)
    const tempVideoPath = path.join(this.tempDir, outputFileName)
    const tempThumbPath = path.join(this.tempDir, `${postId}_thumb.jpg`)

    try {
      // Prepare yt-dlp arguments
      const ytdlpArgs = [
        url,
        '-o', tempVideoPath,
        '--format', `bestvideo[height<=${targetHeight}]+bestaudio/best[height<=${targetHeight}]/best`,
        '--merge-output-format', 'mp4',
        '--write-thumbnail',
        '--convert-thumbnails', 'jpg',
        '--no-playlist',
        '--no-warnings',
        '--quiet',
        '--no-progress',
        '--print-json',
      ]

      // Add max filesize if specified
      if (maxFilesize > 0) {
        ytdlpArgs.push('--max-filesize', maxFilesize.toString())
      }

      logger.info({ url, postId }, 'Starting video download with yt-dlp')

      // Execute yt-dlp
      const result = await this.executeCommand('yt-dlp', ytdlpArgs)
      
      // Parse the JSON output
      const metadata = JSON.parse(result)

      // Check duration
      if (metadata.duration > maxDuration) {
        throw new Error(`Video duration (${metadata.duration}s) exceeds maximum (${maxDuration}s)`)
      }

      // Get file info
      const stats = await fs.stat(tempVideoPath)
      
      // Check if thumbnail was downloaded
      let thumbnailExists = false
      try {
        await fs.access(tempThumbPath)
        thumbnailExists = true
      } catch {
        // Thumbnail not downloaded, that's okay
      }

      // Extract metadata
      const downloadResult: DownloadResult = {
        videoPath: tempVideoPath,
        thumbnailPath: thumbnailExists ? tempThumbPath : undefined,
        metadata: {
          width: metadata.width || 1920,
          height: metadata.height || 1080,
          duration: metadata.duration || 0,
          filesize: stats.size,
          format: 'mp4',
        },
      }

      logger.info({ postId, metadata: downloadResult.metadata }, 'Video downloaded successfully')

      return downloadResult
    } catch (error) {
      // Clean up temp files on error
      try {
        await fs.unlink(tempVideoPath)
        await fs.unlink(tempThumbPath)
      } catch {
        // Ignore cleanup errors
      }

      logger.error({ error, url, postId }, 'Failed to download video')
      throw error
    }
  }

  /**
   * Transcode video for Pinterest compatibility
   */
  async transcodeForPinterest(
    inputPath: string,
    options: {
      targetRatio?: string
      maxDuration?: number
    } = {}
  ): Promise<string> {
    const { targetRatio = '9:16', maxDuration = 900 } = options

    const outputPath = inputPath.replace('.mp4', '_pinterest.mp4')

    try {
      const ffmpegArgs = [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
      ]

      // Add duration limit
      if (maxDuration > 0) {
        ffmpegArgs.push('-t', maxDuration.toString())
      }

      // Add aspect ratio adjustment if needed
      if (targetRatio === '9:16') {
        ffmpegArgs.push(
          '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black'
        )
      } else if (targetRatio === '1:1') {
        ffmpegArgs.push(
          '-vf', 'scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:black'
        )
      }

      ffmpegArgs.push('-y', outputPath)

      logger.info({ inputPath, targetRatio }, 'Transcoding video for Pinterest')

      await this.executeCommand('ffmpeg', ffmpegArgs)

      logger.info({ outputPath }, 'Video transcoded successfully')

      return outputPath
    } catch (error) {
      logger.error({ error, inputPath }, 'Failed to transcode video')
      throw error
    }
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(videoPath: string, time = '00:00:01'): Promise<string> {
    const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg')

    try {
      const ffmpegArgs = [
        '-i', videoPath,
        '-ss', time,
        '-vframes', '1',
        '-vf', 'scale=320:-1',
        '-y', thumbnailPath,
      ]

      await this.executeCommand('ffmpeg', ffmpegArgs)

      logger.info({ videoPath, thumbnailPath }, 'Thumbnail generated')

      return thumbnailPath
    } catch (error) {
      logger.error({ error, videoPath }, 'Failed to generate thumbnail')
      throw error
    }
  }

  /**
   * Get video metadata using ffprobe
   */
  async getVideoMetadata(videoPath: string): Promise<any> {
    try {
      const ffprobeArgs = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath,
      ]

      const result = await this.executeCommand('ffprobe', ffprobeArgs)
      return JSON.parse(result)
    } catch (error) {
      logger.error({ error, videoPath }, 'Failed to get video metadata')
      throw error
    }
  }

  /**
   * Save downloaded files to storage
   */
  async saveToStorage(
    downloadResult: DownloadResult,
    postId: string
  ): Promise<{
    videoKey: string
    videoUrl: string
    thumbnailKey?: string
    thumbnailUrl?: string
  }> {
    // Read video file
    const videoBuffer = await fs.readFile(downloadResult.videoPath)
    const videoKey = `videos/${postId}/${path.basename(downloadResult.videoPath)}`
    
    // Save video to storage
    const { key: savedVideoKey } = await saveFile(videoKey, videoBuffer, 'video/mp4')
    
    // Get video URL
    const videoUrl = await (await import('@/lib/storage')).getFileUrl(savedVideoKey)

    let thumbnailKey: string | undefined
    let thumbnailUrl: string | undefined

    // Save thumbnail if available
    if (downloadResult.thumbnailPath) {
      const thumbnailBuffer = await fs.readFile(downloadResult.thumbnailPath)
      thumbnailKey = `thumbnails/${postId}/${path.basename(downloadResult.thumbnailPath)}`
      
      const { key: savedThumbKey } = await saveFile(thumbnailKey, thumbnailBuffer, 'image/jpeg')
      thumbnailUrl = await (await import('@/lib/storage')).getFileUrl(savedThumbKey)
    }

    // Clean up temp files
    try {
      await fs.unlink(downloadResult.videoPath)
      if (downloadResult.thumbnailPath) {
        await fs.unlink(downloadResult.thumbnailPath)
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to clean up temp files')
    }

    return {
      videoKey: savedVideoKey,
      videoUrl,
      thumbnailKey,
      thumbnailUrl,
    }
  }

  /**
   * Execute command with promise wrapper
   */
  private executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args)
      let stdout = ''
      let stderr = ''

      process.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      process.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim())
        } else {
          reject(new Error(`${command} exited with code ${code}: ${stderr}`))
        }
      })

      process.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Clean up old temp files
   */
  async cleanupTempFiles(olderThanHours = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir)
      const now = Date.now()
      const maxAge = olderThanHours * 60 * 60 * 1000

      for (const file of files) {
        const filePath = path.join(this.tempDir, file)
        const stats = await fs.stat(filePath)
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath)
          logger.debug({ file }, 'Deleted old temp file')
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup temp files')
    }
  }
}

// Singleton instance
export const videoDownloader = new VideoDownloader()
