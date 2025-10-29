import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'
import { redditClient } from '@/lib/reddit/client'
import { redditSessionManager } from '@/lib/reddit/session-manager'

const logger = createLogger('api/campaigns-test')

// POST /api/campaigns/[id]/test - Test a specific campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Test Reddit connection and fetch sample posts
    let postsFound = 0
    try {
      // Set session cookie if available
      const sessionConfig = await redditSessionManager.getSessionConfig()
      if (sessionConfig.enabled && sessionConfig.sessionCookie) {
        redditClient.setSessionCookie(sessionConfig.sessionCookie)
      }

      const subreddits = Array.isArray(campaign.subreddits) 
        ? campaign.subreddits 
        : JSON.parse(campaign.subreddits as string)
      
      const keywords = Array.isArray(campaign.keywords) 
        ? campaign.keywords 
        : JSON.parse(campaign.keywords as string)
      
      const excludeKeywords = Array.isArray(campaign.excludeKeywords) 
        ? campaign.excludeKeywords 
        : JSON.parse(campaign.excludeKeywords as string)

      // Fetch posts from first subreddit as test
      if (subreddits.length > 0) {
        const subreddit = subreddits[0]
        const posts = await redditClient.fetchPosts({
          subreddits: [subreddit],
          sort: campaign.sortBy as any,
          time: campaign.timeRange as any,
          limit: 5,
          includeNsfw: campaign.includeNsfw
        })
        
        // Filter posts based on campaign criteria
        const filteredPosts = posts.filter(post => {
          // Check minimum score
          if (post.score < campaign.minScore) return false
          
          // Check maximum score if set
          if (campaign.maxScore && post.score > campaign.maxScore) return false
          
          // Check keywords (if any)
          if (keywords.length > 0) {
            const titleLower = post.title.toLowerCase()
            const hasKeyword = keywords.some(keyword => 
              titleLower.includes(keyword.toLowerCase())
            )
            if (!hasKeyword) return false
          }
          
          // Check exclude keywords
          if (excludeKeywords.length > 0) {
            const titleLower = post.title.toLowerCase()
            const hasExcludeKeyword = excludeKeywords.some(keyword => 
              titleLower.includes(keyword.toLowerCase())
            )
            if (hasExcludeKeyword) return false
          }
          
          return true
        })
        
        postsFound = filteredPosts.length
      }
    } catch (error) {
      logger.error({ error, campaignId }, 'Failed to test Reddit connection')
      return NextResponse.json(
        { success: false, error: 'Failed to connect to Reddit' },
        { status: 500 }
      )
    }

    logger.info({ campaignId, postsFound }, 'Campaign test completed')
    return NextResponse.json({
      success: true,
      data: {
        postsFound,
        message: `Found ${postsFound} posts matching campaign criteria`,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to test campaign')
    return NextResponse.json(
      { success: false, error: 'Failed to test campaign' },
      { status: 500 }
    )
  }
}
