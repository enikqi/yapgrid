import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'
import { MediaDownloader } from '@/lib/media/downloader'

const logger = createLogger('api/posts-process')

// POST /api/posts/process - Process NEW posts to READY status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchSize = 5, intervalMinutes = 30 } = body

    // Get NEW posts (regardless of processedAt - some might be partially processed)
    const newPosts = await prisma.post.findMany({
      where: {
        status: 'NEW',
      },
      orderBy: {
        createdUtc: 'asc',
      },
      take: batchSize,
    })

    if (newPosts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No new posts to process',
          processedCount: 0,
        },
      })
    }

    // Calculate scheduled publish time (intervalMinutes from now)
    const scheduledPublishTime = new Date()
    scheduledPublishTime.setMinutes(scheduledPublishTime.getMinutes() + intervalMinutes)

    // Initialize media downloader
    const downloader = new MediaDownloader()

    // Process each post: download media and update status
    const updatedPosts = await Promise.all(
      newPosts.map(async (post) => {
        try {
          logger.info({ postId: post.id, title: post.title }, 'Processing post')

          // Check if this is a text-only post (self post with no media)
          // Text posts have URLs like reddit.com/r/subreddit/comments/... without media
          const isTextPost = post.url.includes('/comments/') && 
                            !post.url.includes('i.redd.it') && 
                            !post.url.includes('v.redd.it') && 
                            !post.url.includes('/gallery/') &&
                            !post.preview

          if (isTextPost) {
            logger.info({ postId: post.id }, 'Processing text-only post - no media needed')
            // Text posts don't need media - mark as READY for publishing
            return await prisma.post.update({
              where: { id: post.id },
              data: {
                status: 'READY',
                processedAt: new Date(),
                scheduledPublishAt: scheduledPublishTime,
                error: null, // Clear any previous errors
              },
            })
          }

          // Download media for this post
          const mediaInfo = await downloader.downloadMedia(post, post.id)
          
          if (!mediaInfo) {
            logger.warn({ postId: post.id }, 'No media downloaded for post - marking as FAILED')
            // Mark as FAILED if no media is downloaded
            return await prisma.post.update({
              where: { id: post.id },
              data: {
                status: 'FAILED',
                processedAt: new Date(),
                error: 'No media downloaded',
              },
            })
          }

          // Save asset info to database
          // Map media type to AssetType enum
          let assetType: 'VIDEO' | 'THUMBNAIL' | 'AUDIO'
          if (mediaInfo.type === 'video') {
            assetType = 'VIDEO'
          } else if (mediaInfo.type === 'image' || mediaInfo.type === 'gif') {
            assetType = 'THUMBNAIL'
          } else {
            assetType = 'VIDEO' // fallback
          }

          await prisma.asset.create({
            data: {
              postId: post.id,
              type: assetType,
              storage: 'LOCAL',
              pathOrKey: mediaInfo.filename,
              width: mediaInfo.width,
              height: mediaInfo.height,
              durationSec: mediaInfo.duration,
              filesize: mediaInfo.size,
              url: mediaInfo.url,
            },
          })
          logger.info({ postId: post.id, filename: mediaInfo.filename }, 'Media downloaded and saved')

          // Update post to READY status
          return await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'READY',
              processedAt: new Date(),
              scheduledPublishAt: scheduledPublishTime,
            },
          })
        } catch (error) {
          logger.error({ postId: post.id, error }, 'Failed to process post')
          
          // Mark as FAILED if media download fails
          return await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'FAILED',
              processedAt: new Date(),
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          })
        }
      })
    )

    logger.info({ 
      processedCount: updatedPosts.length,
      intervalMinutes,
      scheduledPublishTime: scheduledPublishTime.toISOString()
    }, 'Posts processed to READY status')

    return NextResponse.json({
      success: true,
      data: {
        processedCount: updatedPosts.length,
        scheduledPublishTime: scheduledPublishTime.toISOString(),
        posts: updatedPosts.map(post => ({
          id: post.id,
          title: post.title,
          status: post.status,
          scheduledPublishAt: post.scheduledPublishAt,
        })),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to process posts')
    return NextResponse.json(
      { success: false, error: 'Failed to process posts' },
      { status: 500 }
    )
  }
}

// GET /api/posts/process - Get processing statistics
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

    // Get posts ready to publish (scheduled time has passed)
    const readyToPublish = await prisma.post.count({
      where: {
        status: 'READY',
        scheduledPublishAt: {
          lte: new Date(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        statusCounts,
        readyToPublish,
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get processing statistics')
    return NextResponse.json(
      { success: false, error: 'Failed to get processing statistics' },
      { status: 500 }
    )
  }
}
