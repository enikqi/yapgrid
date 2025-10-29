import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/auto-publish')

// POST /api/auto-publish - Auto-publish posts based on schedule
export async function POST(request: NextRequest) {
  try {
    // Get auto-posting configuration
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'autoPublish',
            'autoPublishIntervalMinutes',
            'autoPublishBatchSize'
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
        case 'autoPublish':
          config.enabled = setting.value === 'true'
          break
        case 'autoPublishIntervalMinutes':
          config.intervalMinutes = parseInt(setting.value)
          break
        case 'autoPublishBatchSize':
          config.batchSize = parseInt(setting.value)
          break
      }
    })

    if (!config.enabled) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Auto-posting is disabled',
          publishedCount: 0
        }
      })
    }

    // Get READY posts for auto-publishing
    // First try to get posts WITH assets, then fallback to text-only posts
    let readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: {
          some: {} // Posts that have at least one asset
        }
      },
      include: {
        assets: true
      },
      orderBy: {
        createdAt: 'asc' // Oldest first
      },
      take: config.batchSize,
    })

    // If we don't have enough posts with assets, get text-only posts
    if (readyPosts.length < config.batchSize) {
      const remainingCount = config.batchSize - readyPosts.length
      const textOnlyPosts = await prisma.post.findMany({
        where: {
          status: 'READY',
          assets: {
            none: {} // Posts with no assets
          }
        },
        include: {
          assets: true
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: remainingCount,
      })
      readyPosts = [...readyPosts, ...textOnlyPosts]
    }

    if (readyPosts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No posts ready to publish',
          publishedCount: 0
        }
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
      postsWithAssets: publishedPosts.filter(p => p.assets && p.assets.length > 0).length,
      textOnlyPosts: publishedPosts.filter(p => !p.assets || p.assets.length === 0).length,
      config
    }, 'Posts auto-published')

    return NextResponse.json({
      success: true,
      data: {
        publishedCount: publishedPosts.length,
        postsWithAssets: publishedPosts.filter(p => p.assets && p.assets.length > 0).length,
        textOnlyPosts: publishedPosts.filter(p => !p.assets || p.assets.length === 0).length,
        posts: publishedPosts.map(post => ({
          id: post.id,
          title: post.title,
          status: post.status,
          publishedAt: post.publishedAt,
          hasAssets: post.assets && post.assets.length > 0
        })),
        message: `${publishedPosts.length} posts auto-published`
      }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to auto-publish posts')
    return NextResponse.json(
      { success: false, error: 'Failed to auto-publish posts' },
      { status: 500 }
    )
  }
}
