import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/admin/reddit')

// GET /api/admin/reddit - Get Reddit stats and subreddit info
export async function GET() {
  try {
    // Get total posts count
    const totalPosts = await prisma.post.count()
    
    // Get posts by status
    const publishedPosts = await prisma.post.count({ where: { status: 'PUBLISHED' } })
    const newPosts = await prisma.post.count({ where: { status: 'NEW' } })
    const readyPosts = await prisma.post.count({ where: { status: 'READY' } })
    const failedPosts = await prisma.post.count({ where: { status: 'FAILED' } })

    // Get subreddit stats
    const subredditStats = await prisma.post.groupBy({
      by: ['subreddit'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get last fetch time from settings
    const lastFetchSetting = await prisma.setting.findUnique({
      where: { key: 'last_reddit_fetch' }
    })

    // Get active subreddits (those with recent posts)
    const activeSubreddits = await prisma.post.groupBy({
      by: ['subreddit'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      _count: {
        id: true
      }
    })

    const activeSubredditNames = new Set(activeSubreddits.map(s => s.subreddit))

    // Format subreddit info
    const subreddits = subredditStats.map(stat => ({
      name: stat.subreddit,
      postsCount: stat._count.id,
      lastFetchTime: lastFetchSetting?.value || null,
      status: activeSubredditNames.has(stat.subreddit) ? 'active' : 'inactive'
    }))

    const stats = {
      totalSubreddits: subredditStats.length,
      activeSubreddits: activeSubredditNames.size,
      totalPosts,
      publishedPosts,
      newPosts,
      readyPosts,
      failedPosts,
      lastFetchTime: lastFetchSetting?.value || null,
      fetchStatus: 'idle' as const, // TODO: Implement actual fetch status
      sessionStatus: 'active' as const // TODO: Implement actual session status
    }

    logger.info({ 
      totalSubreddits: stats.totalSubreddits,
      totalPosts: stats.totalPosts,
      publishedPosts: stats.publishedPosts
    }, 'Reddit stats fetched')

    return NextResponse.json({
      success: true,
      data: {
        stats,
        subreddits
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to fetch Reddit data')
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Reddit data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/admin/reddit - Handle Reddit actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    let result = { success: true, message: '' }

    switch (action) {
      case 'clear_cache':
        // Clear any cached Reddit data
        await prisma.setting.deleteMany({
          where: {
            key: {
              startsWith: 'reddit_cache_'
            }
          }
        })
        result.message = 'Reddit cache cleared successfully'
        logger.info('Reddit cache cleared')
        break

      case 'test_session':
        // Test Reddit session validity
        // TODO: Implement actual Reddit session test
        result.message = 'Reddit session test completed (mock)'
        logger.info('Reddit session test completed')
        break

      case 'refresh_subreddits':
        // Refresh subreddit list
        // TODO: Implement actual subreddit refresh
        result.message = 'Subreddits refreshed successfully (mock)'
        logger.info('Subreddits refreshed')
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result.success,
      data: { message: result.message }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to execute Reddit action')
    return NextResponse.json(
      { success: false, error: 'Failed to execute Reddit action' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
