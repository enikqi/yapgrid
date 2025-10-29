import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const algorithm = searchParams.get('algorithm') || 'trending'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get all subreddits with their post counts and engagement metrics
    const subredditStats = await prisma.post.groupBy({
      by: ['subreddit'],
      where: {
        status: 'PUBLISHED'
      },
      _count: {
        id: true
      },
      _avg: {
        score: true
      },
      _sum: {
        score: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get recent posts for recency scoring
    const recentPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        subreddit: true,
        publishedAt: true,
        score: true
      }
    })

    // Calculate community scores based on algorithm
    const communityScores = subredditStats.map(stat => {
      const subreddit = stat.subreddit
      const totalPosts = stat._count.id
      const avgScore = stat._avg.score || 0
      const totalScore = stat._sum.score || 0
      
      // Get recent activity (last 7 days)
      const recentActivity = recentPosts.filter(post => post.subreddit === subreddit)
      const recentPostsCount = recentActivity.length
      const recentAvgScore = recentActivity.length > 0 
        ? recentActivity.reduce((sum, post) => sum + post.score, 0) / recentActivity.length 
        : 0

      let score = 0

      switch (algorithm) {
        case 'trending':
          // Trending: Based on recent activity and high scores
          score = (recentPostsCount * 0.4) + (recentAvgScore * 0.3) + (totalPosts * 0.2) + (avgScore * 0.1)
          break
        case 'popular':
          // Popular: Based on total posts and total score
          score = (totalPosts * 0.5) + (totalScore * 0.3) + (avgScore * 0.2)
          break
        case 'hot':
          // Hot: Based on recent high-scoring posts
          score = (recentPostsCount * 0.6) + (recentAvgScore * 0.4)
          break
        default:
          // Default: Mix of all factors
          score = (totalPosts * 0.3) + (avgScore * 0.3) + (recentPostsCount * 0.2) + (recentAvgScore * 0.2)
      }

      return {
        subreddit,
        score: Math.round(score * 100) / 100,
        totalPosts,
        avgScore: Math.round(avgScore * 100) / 100,
        recentPostsCount,
        recentAvgScore: Math.round(recentAvgScore * 100) / 100
      }
    })

    // Sort by score and limit results
    const sortedCommunities = communityScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // If user is logged in, get their interaction data for personalization
    let personalizedCommunities = sortedCommunities

    if (session?.user?.email) {
      // Get user's interaction history
      const userInteractions = await prisma.postHistory.findMany({
        where: {
          user: {
            email: session.user.email
          }
        },
        include: {
          post: {
            select: {
              subreddit: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      })

      // Calculate user preferences
      const subredditInteractions = userInteractions.reduce((acc, interaction) => {
        const subreddit = interaction.post.subreddit
        acc[subreddit] = (acc[subreddit] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Boost communities the user has interacted with
      personalizedCommunities = sortedCommunities.map(community => {
        const userInteractionCount = subredditInteractions[community.subreddit] || 0
        const personalizationBoost = userInteractionCount * 0.1 // Small boost for user interactions
        return {
          ...community,
          score: community.score + personalizationBoost,
          userInteractionCount
        }
      }).sort((a, b) => b.score - a.score)
    }

    return NextResponse.json({
      success: true,
      data: {
        communities: personalizedCommunities,
        algorithm,
        totalCommunities: subredditStats.length
      }
    })

  } catch (error) {
    console.error('Error fetching personalized communities:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
