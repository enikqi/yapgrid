import { Worker, Job } from 'bullmq'
import cron from 'node-cron'
import { config } from '@/lib/config'
import { createLogger } from '@/lib/logger'
import { prisma } from '@/lib/db/prisma'
import { 
  mediaQueue, 
  publishQueue, 
  ingestQueue,
  createIngestJob,
  createPublishJob,
  QUEUE_NAMES 
} from '@/lib/queue'
import { videoDownloader } from '@/lib/video/downloader'
import { redditClient } from '@/lib/reddit/client'
import { createPinterestClient } from '@/lib/pinterest/client'
import type { 
  IngestJobPayload, 
  DownloadJobPayload, 
  PublishJobPayload,
  AppSettings 
} from '@/lib/types'

const logger = createLogger('worker')

// Get settings from database
async function getSettings(): Promise<AppSettings> {
  const settings = await prisma.setting.findMany()
  
  const defaultSettings: AppSettings = {
    subreddits: [],
    keywords: [],
    minUpvotes: 100,
    includeNsfw: false,
    maxDuration: 900,
    maxFilesize: 400,
    watermarkEnabled: false,
    autoIngest: false,
    autoPublish: false,
    requireApproval: false,
    titleTemplate: '{title}',
    descriptionTemplate: '{title} • r/{subreddit} | Source: https://reddit.com{permalink}',
  }

  // Merge settings from database
  settings.forEach(setting => {
    if (setting.key in defaultSettings) {
      (defaultSettings as any)[setting.key] = setting.value
    }
  })

  return defaultSettings
}

// Media processing worker (only create if Redis is available)
let mediaWorker: Worker | null = null
try {
  mediaWorker = new Worker(
    QUEUE_NAMES.MEDIA,
    async (job: Job) => {
    const { postId, videoUrl, audioUrl } = job.data as DownloadJobPayload
    
    logger.info({ jobId: job.id, postId }, 'Processing media download job')

    try {
      // Update post status
      await prisma.post.update({
        where: { id: postId },
        data: { status: 'DOWNLOADING' },
      })

      // Download video using yt-dlp (handles audio merging automatically)
      const downloadResult = await videoDownloader.downloadVideo(
        videoUrl,
        postId,
        {
          maxDuration: config.MAX_DURATION_SECONDS,
          maxFilesize: config.MAX_FILESIZE_MB * 1024 * 1024,
        }
      )

      // Save to storage
      const storageResult = await videoDownloader.saveToStorage(downloadResult, postId)

      // Create asset records
      await prisma.asset.createMany({
        data: [
          {
            postId,
            type: 'VIDEO',
            storage: config.STORAGE_DRIVER === 's3' ? 'S3' : 'LOCAL',
            pathOrKey: storageResult.videoKey,
            url: storageResult.videoUrl,
            width: downloadResult.metadata.width,
            height: downloadResult.metadata.height,
            durationSec: downloadResult.metadata.duration,
            filesize: downloadResult.metadata.filesize,
            mimeType: 'video/mp4',
          },
          ...(storageResult.thumbnailKey ? [{
            postId,
            type: 'THUMBNAIL' as const,
            storage: config.STORAGE_DRIVER === 's3' ? 'S3' as const : 'LOCAL' as const,
            pathOrKey: storageResult.thumbnailKey,
            url: storageResult.thumbnailUrl,
            mimeType: 'image/jpeg',
          }] : []),
        ],
      })

      // Update post status
      await prisma.post.update({
        where: { id: postId },
        data: { status: 'READY' },
      })

      // Create publish job if auto-publish is enabled
      const settings = await getSettings()
      if (settings.autoPublish && !settings.requireApproval) {
        await createPublishJob({
          postId,
          boardId: config.PINTEREST_DEFAULT_BOARD_ID || '',
        })
      }

      logger.info({ postId }, 'Media download completed successfully')
    } catch (error) {
      logger.error({ error, postId }, 'Media download failed')
      
      await prisma.post.update({
        where: { id: postId },
        data: { 
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Download failed',
        },
      })
      
      throw error
    }
  },
  {
    connection: { url: config.REDIS_URL },
    concurrency: config.QUEUE_CONCURRENCY,
  }
)
} catch (error) {
  logger.warn('Media worker not available (Redis not connected)')
}

// Publishing worker (only create if Redis is available)
let publishWorker: Worker | null = null
try {
  publishWorker = new Worker(
    QUEUE_NAMES.PUBLISH,
    async (job: Job) => {
    const { postId, boardId, title, description } = job.data as PublishJobPayload
    
    logger.info({ jobId: job.id, postId, boardId }, 'Processing publish job')

    try {
      // Get post with assets
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { assets: true },
      })

      if (!post) {
        throw new Error('Post not found')
      }

      if (post.status !== 'READY') {
        throw new Error(`Post not ready for publishing (status: ${post.status})`)
      }

      // Find video asset
      const videoAsset = post.assets.find(a => a.type === 'VIDEO')
      if (!videoAsset) {
        throw new Error('Video asset not found')
      }

      // Update status
      await prisma.post.update({
        where: { id: postId },
        data: { status: 'PUBLISHING' },
      })

      // Get settings for templates
      const settings = await getSettings()
      
      // Prepare pin data
      const pinTitle = title || settings.titleTemplate.replace(/{(\w+)}/g, (_, key) => {
        return (post as any)[key] || ''
      })
      
      const pinDescription = description || settings.descriptionTemplate.replace(/{(\w+)}/g, (_, key) => {
        return (post as any)[key] || ''
      })

      // Get video file path
      let videoPath: string
      if (videoAsset.storage === 'LOCAL') {
        const path = await import('path')
        videoPath = path.join(process.cwd(), config.MEDIA_DIR, videoAsset.pathOrKey)
      } else {
        // For S3, download to temp first
        const storage = await import('@/lib/storage')
        const tempPath = await import('path')
        const fs = await import('fs/promises')
        
        const buffer = await storage.getStorage().get(videoAsset.pathOrKey)
        videoPath = tempPath.join(process.cwd(), 'temp', `${postId}_publish.mp4`)
        await fs.writeFile(videoPath, buffer)
      }

      // Publish to Pinterest
      const pinterestClient = createPinterestClient()
      const pin = await pinterestClient.publishVideo({
        videoPath,
        boardId: boardId || config.PINTEREST_DEFAULT_BOARD_ID || '',
        title: pinTitle.substring(0, 100),
        description: pinDescription.substring(0, 500),
        link: `https://reddit.com${post.permalink}`,
        videoSpecs: videoAsset.width && videoAsset.height && videoAsset.durationSec ? {
          width: videoAsset.width,
          height: videoAsset.height,
          duration: videoAsset.durationSec,
          filesize: videoAsset.filesize || 0,
        } : undefined,
      })

      // Update post with pin info
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          pinId: pin.id,
          boardId,
          publishedAt: new Date(),
        },
      })

      // Clean up temp file if S3
      if (videoAsset.storage === 'S3') {
        const fs = await import('fs/promises')
        try {
          await fs.unlink(videoPath)
        } catch {
          // Ignore cleanup errors
        }
      }

      logger.info({ postId, pinId: pin.id }, 'Post published successfully')
    } catch (error) {
      logger.error({ error, postId }, 'Publishing failed')
      
      await prisma.post.update({
        where: { id: postId },
        data: { 
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Publishing failed',
        },
      })
      
      throw error
    }
  },
  {
    connection: { url: config.REDIS_URL },
    concurrency: Math.max(1, Math.floor(config.QUEUE_CONCURRENCY / 2)), // Lower concurrency for Pinterest API
  }
)
} catch (error) {
  logger.warn('Publish worker not available (Redis not connected)')
}

// Ingest worker (only create if Redis is available)
let ingestWorker: Worker | null = null
try {
  ingestWorker = new Worker(
  QUEUE_NAMES.INGEST,
  async (job: Job) => {
    const payload = job.data as IngestJobPayload
    
    logger.info({ jobId: job.id, payload }, 'Processing ingest job')

    try {
      // Use the ingest endpoint logic
      const response = await fetch(`http://localhost:${config.APP_PORT}/api/ingest/reddit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Ingest failed')
      }

      logger.info({ jobId: job.id, result: result.data }, 'Ingest completed')
      return result.data
    } catch (error) {
      logger.error({ error, jobId: job.id }, 'Ingest failed')
      throw error
    }
  },
  {
    connection: { url: config.REDIS_URL },
    concurrency: 1, // Process one ingest at a time
  }
)
} catch (error) {
  logger.warn('Ingest worker not available (Redis not connected)')
}

// Setup cron jobs
function setupCronJobs() {
  // Ingest cron job
  if (config.CRON_INGEST) {
    cron.schedule(config.CRON_INGEST, async () => {
      try {
        const settings = await getSettings()
        
        if (!settings.autoIngest || settings.subreddits.length === 0) {
          return
        }

        logger.info('Running scheduled Reddit ingest')
        
        await createIngestJob({
          subreddits: settings.subreddits,
          keywords: settings.keywords,
          minUpvotes: settings.minUpvotes,
          includeNsfw: settings.includeNsfw,
          limit: 25,
        })
      } catch (error) {
        logger.error({ error }, 'Scheduled ingest failed')
      }
    })
    
    logger.info({ cron: config.CRON_INGEST }, 'Ingest cron job scheduled')
  }

  // Auto-processing cron job (runs every 30 seconds to process NEW posts)
  cron.schedule('*/30 * * * * *', async () => {
    try {
      // Get auto-processing configuration
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: [
              'auto_processing_enabled',
              'auto_processing_delay_seconds',
              'auto_processing_batch_size'
            ]
          }
        }
      })

      const config = {
        enabled: false,
        delaySeconds: 10, // Delay between processing each post
        batchSize: 1
      }

      settings.forEach(setting => {
        switch (setting.key) {
          case 'auto_processing_enabled':
            config.enabled = setting.value as boolean
            break
          case 'auto_processing_delay_seconds':
            config.delaySeconds = setting.value as number
            break
          case 'auto_processing_batch_size':
            config.batchSize = setting.value as number
            break
        }
      })

      if (!config.enabled) {
        return
      }

      // Find NEW posts to process
      const postsToProcess = await prisma.post.findMany({
        where: {
          status: 'NEW'
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: config.batchSize
      })

      if (postsToProcess.length === 0) {
        return
      }

      logger.info({ 
        count: postsToProcess.length,
        config 
      }, 'Auto-processing posts')

      // Process each post with delay
      for (const post of postsToProcess) {
        try {
          logger.info({ postId: post.id, title: post.title }, 'Auto-processing post')
          
          // Call the process posts API endpoint
          const response = await fetch(`http://localhost:${config.APP_PORT}/api/posts/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post.id })
          })

          const result = await response.json()
          
          if (result.success) {
            logger.info({ postId: post.id }, 'Post processed successfully')
          } else {
            logger.error({ postId: post.id, error: result.error }, 'Post processing failed')
          }

          // Add delay between posts (except for the last one)
          if (post !== postsToProcess[postsToProcess.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, config.delaySeconds * 1000))
          }
        } catch (error) {
          logger.error({ error, postId: post.id }, 'Failed to process post')
        }
      }
    } catch (error) {
      logger.error({ error }, 'Auto-processing check failed')
    }
  })

  // Auto-publish cron job (runs every minute to check for scheduled posts)
  cron.schedule('* * * * *', async () => {
    try {
      // Get auto-posting configuration
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: [
              'auto_posting_enabled',
              'auto_posting_interval_minutes',
              'auto_posting_batch_size'
            ]
          }
        }
      })

      const config = {
        enabled: false,
        intervalMinutes: 30,
        batchSize: 1
      }

      settings.forEach(setting => {
        switch (setting.key) {
          case 'auto_posting_enabled':
            config.enabled = setting.value as boolean
            break
          case 'auto_posting_interval_minutes':
            config.intervalMinutes = setting.value as number
            break
          case 'auto_posting_batch_size':
            config.batchSize = setting.value as number
            break
        }
      })

      if (!config.enabled) {
        return
      }

      logger.debug('Checking for posts to auto-publish')

      // Call the auto-publish API endpoint
      const response = await fetch(`http://localhost:${config.APP_PORT}/api/auto-publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      
      if (result.success && result.data.publishedCount > 0) {
        logger.info({ 
          publishedCount: result.data.publishedCount,
          config 
        }, 'Auto-published posts')
      }
    } catch (error) {
      logger.error({ error }, 'Auto-publish check failed')
    }
  })
  
  logger.info('Auto-processing cron job scheduled (every 30 seconds)')
  logger.info('Auto-publish cron job scheduled (every minute)')

  // Cleanup cron job (daily at 3 AM)
  cron.schedule('0 3 * * *', async () => {
    try {
      logger.info('Running daily cleanup')
      
      // Clean up old temp files
      await videoDownloader.cleanupTempFiles(48)
      
      // Clean up old completed jobs
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      
      await prisma.job.deleteMany({
        where: {
          status: { in: ['COMPLETED', 'CANCELLED'] },
          finishedAt: { lt: threeDaysAgo },
        },
      })
      
      logger.info('Daily cleanup completed')
    } catch (error) {
      logger.error({ error }, 'Daily cleanup failed')
    }
  })
}

// Error handlers (only if workers are available)
if (mediaWorker) {
  mediaWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Media job failed')
  })
}

if (publishWorker) {
  publishWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Publish job failed')
  })
}

if (ingestWorker) {
  ingestWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Ingest job failed')
  })
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down workers...')
  
  const workersToClose = []
  if (mediaWorker) workersToClose.push(mediaWorker.close())
  if (publishWorker) workersToClose.push(publishWorker.close())
  if (ingestWorker) workersToClose.push(ingestWorker.close())
  
  await Promise.all(workersToClose)
  
  await prisma.$disconnect()
  
  logger.info('Workers shut down successfully')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Start workers
async function start() {
  logger.info('Starting workers...')
  
  // Setup cron jobs
  setupCronJobs()
  
  logger.info('Workers started successfully')
  
  // Log worker status (only if Redis is available)
  setInterval(async () => {
    try {
      if (!mediaWorker || !publishWorker || !ingestWorker) {
        logger.debug('Queue status unavailable (workers not initialized)')
        return
      }
      
      const [mediaJobs, publishJobs, ingestJobs] = await Promise.all([
        mediaQueue.getJobCounts(),
        publishQueue.getJobCounts(),
        ingestQueue.getJobCounts(),
      ])
      
      logger.debug({
        media: mediaJobs,
        publish: publishJobs,
        ingest: ingestJobs,
      }, 'Queue status')
    } catch (error) {
      logger.debug('Queue status unavailable (Redis not connected)')
    }
  }, 60000) // Every minute
}

start().catch((error) => {
  logger.error({ error }, 'Failed to start workers')
  process.exit(1)
})
