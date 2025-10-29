import { Queue, Worker, QueueEvents, Job } from 'bullmq'
import IORedis from 'ioredis'
import { config } from '@/lib/config'
import { createLogger } from '@/lib/logger'
import type {
  JobType,
  IngestJobPayload,
  DownloadJobPayload,
  PublishJobPayload,
} from '@/lib/types'

const logger = createLogger('queue')

// Create Redis connection with graceful error handling
const createRedisConnection = () => {
  // If REDIS_URL is not provided, disable Redis
  if (!config.REDIS_URL) {
    logger.info('Redis URL not provided - queues disabled')
    return null
  }

  try {
    const redis = new IORedis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      connectTimeout: 5000,
      commandTimeout: 5000,
    })

    redis.on('error', (error) => {
      logger.warn({ error }, 'Redis connection error - queues will be disabled')
    })

    redis.on('connect', () => {
      logger.info('Redis connected')
    })

    return redis
  } catch (error) {
    logger.warn({ error }, 'Failed to create Redis connection - queues disabled')
    return null
  }
}

// Queue names
export const QUEUE_NAMES = {
  MEDIA: 'media-processing',
  PUBLISH: 'pin-publishing',
  INGEST: 'reddit-ingest',
} as const

// Create queues with fallback
const redisConnection = createRedisConnection()

export const mediaQueue = redisConnection ? new Queue(QUEUE_NAMES.MEDIA, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600, // 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 86400, // 24 hours
      count: 1000,
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
}) : null

export const publishQueue = redisConnection ? new Queue(QUEUE_NAMES.PUBLISH, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600,
      count: 100,
    },
    removeOnFail: {
      age: 86400,
      count: 1000,
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
}) : null

export const ingestQueue = redisConnection ? new Queue(QUEUE_NAMES.INGEST, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600,
      count: 50,
    },
    removeOnFail: {
      age: 86400,
      count: 100,
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
}) : null

// Queue events for monitoring
export const mediaQueueEvents = redisConnection ? new QueueEvents(QUEUE_NAMES.MEDIA, {
  connection: redisConnection,
}) : null

export const publishQueueEvents = redisConnection ? new QueueEvents(QUEUE_NAMES.PUBLISH, {
  connection: redisConnection,
}) : null

export const ingestQueueEvents = redisConnection ? new QueueEvents(QUEUE_NAMES.INGEST, {
  connection: redisConnection,
}) : null

// Job creation helpers
export const createIngestJob = async (payload: IngestJobPayload) => {
  if (!ingestQueue) {
    logger.warn('Ingest queue not available (Redis disabled)')
    return null
  }
  return ingestQueue.add('ingest-reddit', payload, {
    jobId: `ingest-${Date.now()}`,
  })
}

export const createDownloadJob = async (payload: DownloadJobPayload) => {
  if (!mediaQueue) {
    logger.warn('Media queue not available (Redis disabled)')
    return null
  }
  return mediaQueue.add('download-video', payload, {
    jobId: `download-${payload.postId}-${Date.now()}`,
  })
}

export const createPublishJob = async (payload: PublishJobPayload) => {
  if (!publishQueue) {
    logger.warn('Publish queue not available (Redis disabled)')
    return null
  }
  return publishQueue.add('publish-pin', payload, {
    jobId: `publish-${payload.postId}-${Date.now()}`,
  })
}

// Queue monitoring helpers
export const getQueueStats = async (queue: Queue | null) => {
  if (!queue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0,
    }
  }
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  }
}

export const getAllQueueStats = async () => {
  const [media, publish, ingest] = await Promise.all([
    getQueueStats(mediaQueue),
    getQueueStats(publishQueue),
    getQueueStats(ingestQueue),
  ])

  return {
    media,
    publish,
    ingest,
  }
}

// Clean up queues
export const cleanQueues = async () => {
  const queues = [mediaQueue, publishQueue, ingestQueue].filter(Boolean)
  if (queues.length === 0) {
    logger.info('No queues to clean (Redis disabled)')
    return
  }
  
  await Promise.all(
    queues.map(queue => queue!.obliterate({ force: true }))
  )
}

// Graceful shutdown
export const shutdownQueues = async () => {
  logger.info('Shutting down queues...')
  
  const queues = [mediaQueue, publishQueue, ingestQueue].filter(Boolean)
  const events = [mediaQueueEvents, publishQueueEvents, ingestQueueEvents].filter(Boolean)
  
  if (queues.length === 0 && events.length === 0) {
    logger.info('No queues to shutdown (Redis disabled)')
    return
  }
  
  await Promise.all([
    ...queues.map(queue => queue!.close()),
    ...events.map(event => event!.close()),
  ])
  
  logger.info('Queues shut down successfully')
}
