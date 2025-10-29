import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { redditSessionManager } from '@/lib/reddit/session-manager'
import { createLogger } from '@/lib/logger'
import { MediaDownloader } from '@/lib/media/downloader'

const logger = createLogger('api/campaigns-run')

// POST /api/campaigns/[id]/run - Run a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    // Get campaign from database
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (!campaign.enabled) {
      return NextResponse.json(
        { success: false, error: 'Campaign is disabled' },
        { status: 400 }
      )
    }

    logger.info({ campaignId }, 'Starting campaign execution')

    // Convert campaign to RedditCampaign format
    const subreddits = typeof campaign.subreddits === 'string' 
      ? JSON.parse(campaign.subreddits) 
      : campaign.subreddits as string[]
    
    const keywords = typeof campaign.keywords === 'string'
      ? JSON.parse(campaign.keywords)
      : campaign.keywords as string[]
    
    const excludeKeywords = typeof campaign.excludeKeywords === 'string'
      ? JSON.parse(campaign.excludeKeywords)
      : campaign.excludeKeywords as string[]
    
    const redditCampaign = {
      id: campaign.id,
      name: campaign.name,
      subreddits,
      keywords,
      excludeKeywords,
      minScore: campaign.minScore,
      maxScore: campaign.maxScore,
      sortBy: campaign.sortBy as 'hot' | 'new' | 'top' | 'rising',
      timeRange: campaign.timeRange as 'hour' | 'day' | 'week' | 'month' | 'year' | 'all',
      includeNsfw: campaign.includeNsfw,
      postLimit: campaign.postLimit,
      enabled: campaign.enabled,
    }

    // Fetch posts from Reddit
    logger.info({ campaignId, campaignName: redditCampaign.name }, 'About to fetch posts from Reddit')
    const posts = await redditSessionManager.fetchRedditPosts(redditCampaign)

    logger.info({ campaignId, postCount: posts.length, posts: posts.map(p => ({ id: p.id, title: p.title, score: p.score })) }, 'Fetched posts from Reddit')

            // Save posts to database
            logger.info({ campaignId, postsToSave: posts.length }, 'Starting to save posts to database')
            const savedPosts = []
            for (const post of posts) {
              try {
                // Check if post already exists
                const existingPost = await prisma.post.findUnique({
                  where: { redditId: post.id }
                })
                
                if (existingPost) {
                  logger.info({ postId: post.id }, 'Post already exists, skipping')
                  savedPosts.push(existingPost)
                  continue
                }
                
                logger.info({ postId: post.id, title: post.title }, 'Attempting to save post')
                const savedPost = await prisma.post.create({
                  data: {
                    redditId: post.id,
                    title: post.title,
                    author: post.author,
                    subreddit: post.subreddit,
                    permalink: post.permalink,
                    url: post.url,
                    score: post.score,
                    nsfw: post.over_18,
                    createdUtc: new Date(post.created_utc * 1000),
                    status: 'NEW',
                    campaignId: campaign.id,
                    preview: post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&'),
                  },
                })
                logger.info({ postId: post.id, savedPostId: savedPost.id }, 'Post saved successfully')
                savedPosts.push(savedPost)
              } catch (error) {
                logger.error('Failed to save post', { error, postId: post.id, errorMessage: error instanceof Error ? error.message : 'Unknown error' })
              }
            }
    logger.info({ campaignId, savedCount: savedPosts.length, totalFetched: posts.length }, 'Finished saving posts')

    // Media download will be handled by auto-processing cron job
    logger.info({ campaignId, postsToProcess: savedPosts.length }, 'Posts saved as NEW - media download will be handled by auto-processing cron')

    // Update campaign last run
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { lastRun: new Date() },
    })

    // Enable auto-processing if not already enabled
    const autoProcessingSetting = await prisma.setting.findUnique({
      where: { key: 'auto_processing_enabled' }
    })

    if (!autoProcessingSetting || !autoProcessingSetting.value) {
      await prisma.setting.upsert({
        where: { key: 'auto_processing_enabled' },
        update: { value: true },
        create: { key: 'auto_processing_enabled', value: true }
      })
      
      // Set default delay to 15 seconds for slow processing
      await prisma.setting.upsert({
        where: { key: 'auto_processing_delay_seconds' },
        update: { value: 15 },
        create: { key: 'auto_processing_delay_seconds', value: 15 }
      })
      
      // Set batch size to 1 for careful processing
      await prisma.setting.upsert({
        where: { key: 'auto_processing_batch_size' },
        update: { value: 1 },
        create: { key: 'auto_processing_batch_size', value: 1 }
      })
      
      logger.info({ campaignId }, 'Auto-processing enabled automatically')
    }

    logger.info({ campaignId, savedCount: savedPosts.length }, 'Campaign execution completed')

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        postsFetched: posts.length,
        postsSaved: savedPosts.length,
        mediaDownloaded: 0, // Media download handled by auto-processing cron
        posts: savedPosts,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to run campaign')
    return NextResponse.json(
      { success: false, error: 'Failed to run campaign' },
      { status: 500 }
    )
  }
}