import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/test-create-post')

// GET /api/test-create-post - Create a test post
export async function GET() {
  try {
    // Get campaign
    const campaign = await prisma.campaign.findFirst()
    
    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: 'No campaign found',
      })
    }
    
    // Create test post
    const testPost = await prisma.post.create({
      data: {
        redditId: 'test_' + Date.now(),
        title: 'Test Post from API',
        author: 'test_author',
        subreddit: 'test_subreddit',
        permalink: '/test/permalink',
        url: 'https://reddit.com/test',
        score: 100,
        nsfw: false,
        createdUtc: new Date(),
        status: 'NEW',
        campaignId: campaign.id,
      },
    })
    
    logger.info({ postId: testPost.id }, 'Test post created')
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Test post created successfully',
        post: testPost,
      },
    })
  } catch (error) {
    logger.error('Failed to create test post', { error, errorMessage: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

