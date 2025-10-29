import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { redditClient } from '@/lib/reddit/client'
import { createDownloadJob } from '@/lib/queue'
import { createLogger } from '@/lib/logger'
import type { ApiResponse, IngestJobPayload } from '@/lib/types'

const logger = createLogger('api/ingest/reddit')

export async function POST(request: NextRequest) {
  try {
    const payload: IngestJobPayload = await request.json()
    
    const {
      subreddits = [],
      keywords = [],
      minUpvotes = 100,
      includeNsfw = false,
      limit = 25,
    } = payload

    if (!subreddits.length) {
      const response: ApiResponse = {
        success: false,
        error: 'At least one subreddit is required',
      }
      return NextResponse.json(response, { status: 400 })
    }

    logger.info({ subreddits, keywords, minUpvotes }, 'Starting Reddit ingest')

    // Fetch posts from Reddit
    const posts = await redditClient.fetchPosts({
      subreddits,
      sort: 'hot',
      time: 'day',
      limit,
      includeNsfw,
    })

    logger.info({ count: posts.length }, 'Fetched posts from Reddit')

    // Filter posts
    const filteredPosts = posts.filter(post => {
      // Check minimum upvotes
      if (post.score < minUpvotes) return false

      // Check keywords if provided
      if (keywords.length > 0) {
        const title = post.title.toLowerCase()
        const hasKeyword = keywords.some(keyword => 
          title.includes(keyword.toLowerCase())
        )
        if (!hasKeyword) return false
      }

      return true
    })

    logger.info({ filtered: filteredPosts.length }, 'Filtered posts')

    // Process each post
    const results = {
      total: filteredPosts.length,
      created: 0,
      skipped: 0,
      errors: 0,
    }

    for (const redditPost of filteredPosts) {
      try {
        // Check if post already exists
        const existing = await prisma.post.findUnique({
          where: { redditId: redditPost.id },
        })

        if (existing) {
          results.skipped++
          continue
        }

        // Get video info
        const videoInfo = redditClient.getVideoInfo(redditPost)
        if (!videoInfo) {
          logger.debug({ postId: redditPost.id }, 'Post has no video, skipping')
          results.skipped++
          continue
        }

        // Create post in database
        const post = await prisma.post.create({
          data: {
            redditId: redditPost.id,
            title: redditPost.title,
            author: redditPost.author,
            subreddit: redditPost.subreddit,
            permalink: redditPost.permalink,
            score: redditPost.score,
            nsfw: redditPost.over_18,
            createdUtc: new Date(redditPost.created_utc * 1000),
            status: 'NEW',
          },
        })

        // Create download job
        await createDownloadJob({
          postId: post.id,
          videoUrl: videoInfo.videoUrl,
          audioUrl: videoInfo.audioUrl,
        })

        results.created++
        logger.info({ postId: post.id, redditId: post.redditId }, 'Created post and download job')
      } catch (error) {
        logger.error({ error, redditId: redditPost.id }, 'Failed to process post')
        results.errors++
      }
    }

    const response: ApiResponse = {
      success: true,
      data: results,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Reddit ingest failed')
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Ingest failed',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

// GET endpoint to check ingest status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '24')

    const since = new Date()
    since.setHours(since.getHours() - hours)

    const stats = await prisma.post.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: since,
        },
      },
      _count: true,
    })

    const response: ApiResponse = {
      success: true,
      data: {
        period: `${hours} hours`,
        stats: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count
          return acc
        }, {} as Record<string, number>),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to get ingest stats')
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get ingest stats',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
