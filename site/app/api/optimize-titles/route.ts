import { NextRequest, NextResponse } from 'next/server'
import { getOpenRouterService } from '@/lib/openrouter'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/optimize-titles')

// POST /api/optimize-titles - Optimize post titles using OpenRouter
export async function POST(request: NextRequest) {
  try {
    const { postIds, batchSize = 10 } = await request.json()

    if (!postIds || !Array.isArray(postIds)) {
      return NextResponse.json(
        { success: false, error: 'Post IDs array is required' },
        { status: 400 }
      )
    }

    // Get posts from database
    const posts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        status: 'PUBLISHED'
      },
      include: {
        assets: {
          select: {
            type: true
          }
        }
      }
    })

    if (posts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No posts found' },
        { status: 404 }
      )
    }

    const openRouterService = getOpenRouterService()
    const results = []

    // Process in batches to avoid rate limits
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize)
      
      const requests = batch.map(post => ({
        originalTitle: post.title,
        subreddit: post.subreddit,
        contentType: post.assets.some(a => a.type === 'VIDEO') ? 'video' as const :
                     post.assets.some(a => a.type === 'THUMBNAIL') ? 'image' as const : 'text' as const
      }))

        try {
          const optimizedTitles = await openRouterService.optimizeTitles(requests)
          
          // Update posts with optimized titles
          for (let j = 0; j < batch.length; j++) {
            const post = batch[j]
            const optimizedTitle = optimizedTitles[j]
            
            // Check if title was actually optimized
            if (optimizedTitle && optimizedTitle !== post.title && optimizedTitle.length > 0) {
              await prisma.post.update({
                where: { id: post.id },
                data: { 
                  title: optimizedTitle,
                  updatedAt: new Date()
                }
              })
              
              results.push({
                postId: post.id,
                originalTitle: post.title,
                optimizedTitle: optimizedTitle,
                success: true
              })
              
              logger.info({
                postId: post.id,
                subreddit: post.subreddit,
                originalTitle: post.title,
                optimizedTitle: optimizedTitle
              }, 'Title optimized successfully')
            } else {
              results.push({
                postId: post.id,
                originalTitle: post.title,
                optimizedTitle: post.title,
                success: false,
                reason: optimizedTitle === post.title ? 'No optimization needed' : 'API returned empty or invalid title'
              })
            }
          }
        } catch (error) {
          logger.error({ error, batch: batch.map(p => p.id) }, 'Batch optimization failed')
          
          // Add failed results
          batch.forEach(post => {
            results.push({
              postId: post.id,
              originalTitle: post.title,
              optimizedTitle: post.title,
              success: false,
              reason: 'API error: ' + (error as Error).message
            })
          })
        }

      // Add delay between batches
      if (i + batchSize < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    logger.info({
      totalPosts: posts.length,
      successfulOptimizations: results.filter(r => r.success).length,
      failedOptimizations: results.filter(r => !r.success).length
    }, 'Title optimization batch completed')

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: posts.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to optimize titles')
    return NextResponse.json(
      { success: false, error: 'Failed to optimize titles' },
      { status: 500 }
    )
  }
}

// GET /api/optimize-titles - Get optimization status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const subreddit = searchParams.get('subreddit')

    const whereClause: any = {
      status: 'PUBLISHED'
    }

    if (subreddit) {
      whereClause.subreddit = subreddit
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        subreddit: true,
        publishedAt: true,
        assets: {
          select: {
            type: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: {
        posts: posts.map(post => ({
          id: post.id,
          title: post.title,
          subreddit: post.subreddit,
          publishedAt: post.publishedAt,
          contentType: post.assets.some(a => a.type === 'VIDEO') ? 'video' :
                      post.assets.some(a => a.type === 'THUMBNAIL') ? 'image' : 'text'
        }))
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to get posts for optimization')
    return NextResponse.json(
      { success: false, error: 'Failed to get posts' },
      { status: 500 }
    )
  }
}
