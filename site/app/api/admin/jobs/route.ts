import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/admin/jobs')

// GET /api/admin/jobs - Get all jobs status
export async function GET() {
  try {
    // Get settings for each job type
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'auto_processing_enabled',
            'auto_posting_enabled',
            'auto_ingest_enabled'
          ]
        }
      }
    })

    const settingsMap = new Map()
    settings.forEach(setting => {
      settingsMap.set(setting.key, setting.value === 'true')
    })

    // Get job statistics from database
    const jobStats = await prisma.job.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    const jobCounts = {
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    }

    jobStats.forEach(stat => {
      switch (stat.status) {
        case 'PENDING':
          jobCounts.pending = stat._count.status
          break
        case 'ACTIVE':
          jobCounts.active = stat._count.status
          break
        case 'COMPLETED':
          jobCounts.completed = stat._count.status
          break
        case 'FAILED':
          jobCounts.failed = stat._count.status
          break
        case 'CANCELLED':
          jobCounts.cancelled = stat._count.status
          break
      }
    })

    // Get recent jobs
    const recentJobs = await prisma.job.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        post: {
          select: {
            title: true
          }
        }
      }
    })

    const jobs = [
      {
        id: 'auto-fetch',
        name: 'Auto Fetch Posts',
        status: settingsMap.get('auto_ingest_enabled') ? 'running' : 'stopped',
        description: 'Automatically fetches new posts from Reddit campaigns',
        enabled: settingsMap.get('auto_ingest_enabled') || false,
        lastRun: recentJobs.find(j => j.type === 'INGEST_REDDIT')?.startedAt?.toISOString(),
        nextRun: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Mock next run
        jobCounts: {
          pending: jobCounts.pending,
          active: jobCounts.active,
          completed: jobCounts.completed,
          failed: jobCounts.failed
        }
      },
      {
        id: 'auto-process',
        name: 'Auto Process Posts',
        status: settingsMap.get('auto_processing_enabled') ? 'running' : 'stopped',
        description: 'Processes NEW posts to READY status with media download',
        enabled: settingsMap.get('auto_processing_enabled') || false,
        lastRun: recentJobs.find(j => j.type === 'DOWNLOAD_VIDEO')?.startedAt?.toISOString(),
        nextRun: new Date(Date.now() + 30 * 1000).toISOString(), // Mock next run (30 seconds)
        jobCounts: {
          pending: jobCounts.pending,
          active: jobCounts.active,
          completed: jobCounts.completed,
          failed: jobCounts.failed
        }
      },
      {
        id: 'auto-publish',
        name: 'Auto Publish Posts',
        status: settingsMap.get('auto_posting_enabled') ? 'running' : 'stopped',
        description: 'Publishes READY posts to the homepage',
        enabled: settingsMap.get('auto_posting_enabled') || false,
        lastRun: recentJobs.find(j => j.type === 'PUBLISH_PINTEREST')?.startedAt?.toISOString(),
        nextRun: new Date(Date.now() + 60 * 1000).toISOString(), // Mock next run (1 minute)
        jobCounts: {
          pending: jobCounts.pending,
          active: jobCounts.active,
          completed: jobCounts.completed,
          failed: jobCounts.failed
        }
      },
      {
        id: 'title-optimization',
        name: 'Title Optimization',
        status: 'idle',
        description: 'Optimizes post titles using AI for better SEO',
        enabled: false,
        lastRun: null,
        nextRun: null,
        jobCounts: {
          pending: 0,
          active: 0,
          completed: 0,
          failed: 0
        }
      },
      {
        id: 'cleanup',
        name: 'Database Cleanup',
        status: 'stopped',
        description: 'Cleans up old logs and temporary data',
        enabled: false,
        lastRun: recentJobs.find(j => j.type === 'CLEANUP')?.startedAt?.toISOString(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mock next run (24 hours)
        jobCounts: {
          pending: 0,
          active: 0,
          completed: 0,
          failed: 0
        }
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        recentJobs: recentJobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          postTitle: job.post?.title || 'N/A',
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          finishedAt: job.finishedAt,
          error: job.error
        }))
      }
    })

  } catch (error) {
    logger.error('Failed to fetch jobs', { error })
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch jobs' 
    }, { status: 500 })
  }
}

// POST /api/admin/jobs - Update job status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, action } = body

    if (!jobId || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'jobId and action are required' 
      }, { status: 400 })
    }

    if (!['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action. Must be start, stop, or restart' 
      }, { status: 400 })
    }

    let settingKey = ''
    let enabled = false

    switch (jobId) {
      case 'auto-fetch':
        settingKey = 'auto_ingest_enabled'
        enabled = action === 'start' || action === 'restart'
        break
      case 'auto-process':
        settingKey = 'auto_processing_enabled'
        enabled = action === 'start' || action === 'restart'
        break
      case 'auto-publish':
        settingKey = 'auto_posting_enabled'
        enabled = action === 'start' || action === 'restart'
        break
      case 'title-optimization':
        // This job doesn't have a real setting yet
        return NextResponse.json({ 
          success: false, 
          error: 'Title optimization job not implemented yet' 
        }, { status: 400 })
      case 'cleanup':
        // This job uses a different API endpoint
        return NextResponse.json({ 
          success: true,
          data: {
            jobId,
            action,
            enabled: true,
            message: `Job ${action} successful - cleanup will run via /api/admin/cleanup`
          }
        })
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Unknown job ID' 
        }, { status: 400 })
    }

    // Update the setting in database
    await prisma.setting.upsert({
      where: { key: settingKey },
      update: { value: enabled.toString() },
      create: { key: settingKey, value: enabled.toString() }
    })

    logger.info('Job status updated', { jobId, action, enabled })

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        action,
        enabled,
        message: `Job ${action} successful`
      }
    })

  } catch (error) {
    logger.error('Failed to update job status', { error })
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update job status' 
    }, { status: 500 })
  }
}
