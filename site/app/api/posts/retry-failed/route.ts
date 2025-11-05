import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/posts-retry-failed')

// POST /api/posts/retry-failed - Retry failed posts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postIds } = body

    // Get FAILED posts
    const whereClause = postIds 
      ? { id: { in: postIds }, status: 'FAILED' }
      : { status: 'FAILED' }

    const failedPosts = await prisma.post.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        error: true,
      }
    })

    if (failedPosts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No failed posts to retry',
          retriedCount: 0,
        },
      })
    }

    // Reset failed posts to NEW status to retry processing
    const result = await prisma.post.updateMany({
      where: whereClause,
      data: {
        status: 'NEW',
        error: null,
        processedAt: null,
      },
    })

    logger.info({ 
      retriedCount: result.count,
      postIds: failedPosts.map(p => p.id)
    }, 'Reset failed posts to NEW for retry')

    return NextResponse.json({
      success: true,
      data: {
        retriedCount: result.count,
        message: `Reset ${result.count} failed posts to NEW for reprocessing`,
        posts: failedPosts,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to retry failed posts')
    return NextResponse.json(
      { success: false, error: 'Failed to retry failed posts' },
      { status: 500 }
    )
  }
}

// GET /api/posts/retry-failed - Get list of failed posts
export async function GET() {
  try {
    const failedPosts = await prisma.post.findMany({
      where: {
        status: 'FAILED',
      },
      select: {
        id: true,
        title: true,
        url: true,
        error: true,
        createdAt: true,
        processedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      data: {
        failedPosts,
        count: failedPosts.length,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get failed posts')
    return NextResponse.json(
      { success: false, error: 'Failed to get failed posts' },
      { status: 500 }
    )
  }
}

