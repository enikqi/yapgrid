import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/health')

// Track last successful processing time
let lastProcessingTime: Date | null = null
let errorCount = 0
const errorWindow = 60 * 60 * 1000 // 1 hour in milliseconds
const errorTimestamps: number[] = []

export async function GET() {
  try {
    const startTime = Date.now()

    // Check database connection
    let databaseStatus = 'unknown'
    let databaseError: string | null = null
    try {
      await prisma.$queryRaw`SELECT 1`
      databaseStatus = 'connected'
    } catch (error) {
      databaseStatus = 'disconnected'
      databaseError = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Database connection failed', error)
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage()
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    }

    // Get background job status
    let backgroundJobStatus = 'unknown'
    let postCounts: any = {}
    try {
      const stats = await prisma.post.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      })

      postCounts = stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {} as Record<string, number>)

      // Get last processed post time
      const lastProcessed = await prisma.post.findFirst({
        where: {
          processedAt: {
            not: null,
          },
        },
        orderBy: {
          processedAt: 'desc',
        },
        select: {
          processedAt: true,
        },
      })

      if (lastProcessed?.processedAt) {
        lastProcessingTime = lastProcessed.processedAt
      }

      backgroundJobStatus = 'running'
    } catch (error) {
      backgroundJobStatus = 'error'
      logger.error('Failed to get background job status', error)
    }

    // Clean up old error timestamps
    const now = Date.now()
    while (errorTimestamps.length > 0 && now - errorTimestamps[0] > errorWindow) {
      errorTimestamps.shift()
    }
    errorCount = errorTimestamps.length

    // Calculate uptime
    const uptime = process.uptime()
    const uptimeFormatted = formatUptime(uptime)

    // Determine overall health status
    const isHealthy = databaseStatus === 'connected' && memoryUsageMB.heapUsed < 1500
    const status = isHealthy ? 'online' : 'degraded'

    const responseTime = Date.now() - startTime

    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      uptime: uptimeFormatted,
      uptimeSeconds: Math.floor(uptime),
      responseTimeMs: responseTime,
      memory: {
        usage: memoryUsageMB,
        limit: {
          warning: 1500, // MB
          critical: 1800, // MB
        },
        status: memoryUsageMB.heapUsed < 1500 ? 'healthy' : memoryUsageMB.heapUsed < 1800 ? 'warning' : 'critical',
      },
      database: {
        status: databaseStatus,
        error: databaseError,
      },
      backgroundJobs: {
        status: backgroundJobStatus,
        lastSuccessfulProcessing: lastProcessingTime?.toISOString() || null,
        lastSuccessfulProcessingAgo: lastProcessingTime
          ? formatTimeSince(lastProcessingTime)
          : 'never',
        postCounts,
      },
      errors: {
        countLastHour: errorCount,
        status: errorCount < 10 ? 'low' : errorCount < 50 ? 'medium' : 'high',
      },
    }

    // Return appropriate status code based on health
    const statusCode = isHealthy ? 200 : 503

    return NextResponse.json(
      {
        success: true,
        data: healthData,
      },
      { status: statusCode }
    )
  } catch (error) {
    logger.error('Health check failed', error)

    // Track error
    errorTimestamps.push(Date.now())

    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        status: 'offline',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60))
  seconds %= 24 * 60 * 60
  const hours = Math.floor(seconds / (60 * 60))
  seconds %= 60 * 60
  const minutes = Math.floor(seconds / 60)
  seconds = Math.floor(seconds % 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)

  return parts.join(' ')
}

// Helper function to format time since
function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
