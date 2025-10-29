import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/scheduler')

// POST /api/scheduler/process - Process NEW posts to READY with intervals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      intervalMinutes = 30, 
      batchSize = 5,
      minIntervalMinutes = 1,
      maxIntervalMinutes = 60 
    } = body

    // Validate interval range
    const validInterval = Math.max(
      minIntervalMinutes, 
      Math.min(maxIntervalMinutes, intervalMinutes)
    )

    // Process posts
    const processResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/posts/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batchSize,
        intervalMinutes: validInterval,
      }),
    })

    const processData = await processResponse.json()

    if (!processData.success) {
      throw new Error(processData.error || 'Failed to process posts')
    }

    logger.info({ 
      processedCount: processData.data.processedCount,
      intervalMinutes: validInterval,
      scheduledPublishTime: processData.data.scheduledPublishTime
    }, 'Posts scheduled for publishing')

    return NextResponse.json({
      success: true,
      data: {
        ...processData.data,
        intervalMinutes: validInterval,
        message: `${processData.data.processedCount} posts scheduled for publishing in ${validInterval} minutes`,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to schedule posts')
    return NextResponse.json(
      { success: false, error: 'Failed to schedule posts' },
      { status: 500 }
    )
  }
}

// POST /api/scheduler/publish - Publish READY posts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchSize = 3, forceAll = false } = body

    // Publish posts
    const publishResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/posts/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batchSize,
        forceAll,
      }),
    })

    const publishData = await publishResponse.json()

    if (!publishData.success) {
      throw new Error(publishData.error || 'Failed to publish posts')
    }

    logger.info({ 
      publishedCount: publishData.data.publishedCount,
      forceAll
    }, 'Posts published')

    return NextResponse.json({
      success: true,
      data: {
        ...publishData.data,
        message: `${publishData.data.publishedCount} posts published`,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to publish posts')
    return NextResponse.json(
      { success: false, error: 'Failed to publish posts' },
      { status: 500 }
    )
  }
}

// GET /api/scheduler/status - Get scheduler status
export async function GET() {
  try {
    // Get processing stats
    const processResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/posts/process`, {
      method: 'GET',
    })
    const processData = await processResponse.json()

    // Get publishing stats
    const publishResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/posts/publish`, {
      method: 'GET',
    })
    const publishData = await publishResponse.json()

    return NextResponse.json({
      success: true,
      data: {
        processing: processData.success ? processData.data : null,
        publishing: publishData.success ? publishData.data : null,
        scheduler: {
          status: 'active',
          lastRun: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get scheduler status')
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduler status' },
      { status: 500 }
    )
  }
}
