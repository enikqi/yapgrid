import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/admin/analytics')

// GET /api/admin/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') as '7d' | '30d' | '90d' | '1y' || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get overview stats
    const totalPosts = await prisma.post.count({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const publishedPosts = await prisma.post.count({
      where: {
        status: 'PUBLISHED',
        createdAt: { gte: startDate }
      }
    })

    // Mock analytics data (since we don't have actual view/like/comment tracking yet)
    const mockAnalytics = {
      totalViews: Math.floor(totalPosts * (Math.random() * 1000 + 100)),
      totalLikes: Math.floor(totalPosts * (Math.random() * 50 + 10)),
      totalComments: Math.floor(totalPosts * (Math.random() * 20 + 5)),
      totalShares: Math.floor(totalPosts * (Math.random() * 10 + 2))
    }

    const avgEngagement = mockAnalytics.totalViews > 0 
      ? ((mockAnalytics.totalLikes + mockAnalytics.totalComments + mockAnalytics.totalShares) / mockAnalytics.totalViews) * 100
      : 0

    // Get top posts (mock data)
    const topPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        subreddit: true,
        createdAt: true,
        score: true,
        commentsCount: true
      }
    })

    const topPostsWithAnalytics = topPosts.map(post => ({
      ...post,
      views: Math.floor(Math.random() * 10000 + 1000),
      likes: Math.floor(Math.random() * 500 + 50),
      comments: post.commentsCount || Math.floor(Math.random() * 100 + 10),
      shares: Math.floor(Math.random() * 50 + 5),
      engagement: Math.random() * 10 + 2
    })).sort((a, b) => b.views - a.views)

    // Get subreddit stats
    const subredditStats = await prisma.post.groupBy({
      by: ['subreddit'],
      where: {
        status: 'PUBLISHED',
        createdAt: { gte: startDate }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 20
    })

    const subredditStatsWithAnalytics = subredditStats.map(stat => ({
      name: stat.subreddit,
      posts: stat._count.id,
      views: Math.floor(stat._count.id * (Math.random() * 1000 + 100)),
      likes: Math.floor(stat._count.id * (Math.random() * 50 + 10)),
      comments: Math.floor(stat._count.id * (Math.random() * 20 + 5)),
      shares: Math.floor(stat._count.id * (Math.random() * 10 + 2)),
      avgEngagement: Math.random() * 10 + 2
    }))

    // Generate trend data (mock)
    const generateTrendData = (days: number) => {
      const trends = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        trends.push({
          date: date.toISOString().split('T')[0],
          posts: Math.floor(Math.random() * 50 + 10),
          views: Math.floor(Math.random() * 5000 + 1000),
          likes: Math.floor(Math.random() * 250 + 50),
          comments: Math.floor(Math.random() * 100 + 20),
          shares: Math.floor(Math.random() * 50 + 10)
        })
      }
      return trends
    }

    const trends = {
      daily: generateTrendData(range === '7d' ? 7 : 30),
      weekly: generateTrendData(Math.ceil((range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365) / 7)),
      monthly: generateTrendData(Math.ceil((range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365) / 30))
    }

    const analyticsData = {
      overview: {
        totalPosts,
        totalViews: mockAnalytics.totalViews,
        totalLikes: mockAnalytics.totalLikes,
        totalComments: mockAnalytics.totalComments,
        totalShares: mockAnalytics.totalShares,
        avgEngagement
      },
      trends,
      topPosts: topPostsWithAnalytics,
      subredditStats: subredditStatsWithAnalytics,
      timeRange: range
    }

    logger.info({ 
      range,
      totalPosts,
      totalViews: mockAnalytics.totalViews,
      avgEngagement: avgEngagement.toFixed(2)
    }, 'Analytics data generated')

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    logger.error({ error }, 'Failed to fetch analytics data')
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
