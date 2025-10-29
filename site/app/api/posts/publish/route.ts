import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/posts-publish')

// POST /api/posts/publish - Publish READY posts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchSize = 3, forceAll = false } = body

    // Get READY posts that are scheduled to be published
    const whereClause = forceAll 
      ? { status: 'READY' }
      : {
          status: 'READY',
          scheduledPublishAt: {
            lte: new Date(),
          },
        }

    const readyPosts = await prisma.post.findMany({
      where: whereClause,
      orderBy: {
        scheduledPublishAt: 'asc',
      },
      take: batchSize,
    })

    if (readyPosts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No posts ready to publish',
          publishedCount: 0,
        },
      })
    }

    // Update posts to PUBLISHED status
    const publishedPosts = await Promise.all(
      readyPosts.map(async (post) => {
        return await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        })
      })
    )

    logger.info({ 
      publishedCount: publishedPosts.length,
      forceAll
    }, 'Posts published')

    return NextResponse.json({
      success: true,
      data: {
        publishedCount: publishedPosts.length,
        posts: publishedPosts.map(post => ({
          id: post.id,
          title: post.title,
          status: post.status,
          publishedAt: post.publishedAt,
        })),
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

// GET /api/posts/publish - Get publishing statistics
export async function GET() {
  try {
    const stats = await prisma.post.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Get posts ready to publish now
    const readyToPublishNow = await prisma.post.count({
      where: {
        status: 'READY',
        scheduledPublishAt: {
          lte: new Date(),
        },
      },
    })

    // Get posts scheduled for future
    const scheduledForFuture = await prisma.post.count({
      where: {
        status: 'READY',
        scheduledPublishAt: {
          gt: new Date(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        statusCounts,
        readyToPublishNow,
        scheduledForFuture,
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get publishing statistics')
    return NextResponse.json(
      { success: false, error: 'Failed to get publishing statistics' },
      { status: 500 }
    )
  }
}
