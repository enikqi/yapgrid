import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/campaigns')

// GET /api/campaigns - Get all campaigns
export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: campaigns,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to fetch campaigns')
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      subreddits,
      keywords,
      excludeKeywords,
      minScore,
      maxScore,
      sortBy,
      timeRange,
      includeNsfw,
      postLimit,
      enabled,
    } = body

    // Validate required fields
    if (!name || !subreddits || subreddits.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campaign name and subreddits are required' },
        { status: 400 }
      )
    }

    // Check for duplicate subreddits across all campaigns
    const existingCampaigns = await prisma.campaign.findMany({
      select: { id: true, name: true, subreddits: true }
    })

    const duplicateSubreddits = []
    const existingSubredditMap = new Map()

    // Build map of existing subreddits
    existingCampaigns.forEach(campaign => {
      try {
        let campaignSubreddits = []
        
        // Handle different storage formats
        if (typeof campaign.subreddits === 'string') {
          // Try to parse as JSON first
          try {
            campaignSubreddits = JSON.parse(campaign.subreddits)
          } catch {
            // If not JSON, treat as comma-separated string
            campaignSubreddits = campaign.subreddits.split(',').map(s => s.trim()).filter(s => s)
          }
        } else if (Array.isArray(campaign.subreddits)) {
          campaignSubreddits = campaign.subreddits
        }
        
        campaignSubreddits.forEach(subreddit => {
          if (!existingSubredditMap.has(subreddit)) {
            existingSubredditMap.set(subreddit, campaign.name)
          }
        })
      } catch (error) {
        console.log('Error parsing campaign subreddits:', error)
      }
    })

    // Check for duplicates
    subreddits.forEach(subreddit => {
      if (existingSubredditMap.has(subreddit)) {
        duplicateSubreddits.push({
          subreddit,
          existingIn: existingSubredditMap.get(subreddit)
        })
      }
    })

    // Debug logging
    console.log('Existing subreddit map:', Array.from(existingSubredditMap.entries()))
    console.log('New subreddits:', subreddits)
    console.log('Duplicates found:', duplicateSubreddits)

    // If duplicates found, return warning with details
    if (duplicateSubreddits.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Duplicate subreddits found',
        duplicates: duplicateSubreddits,
        message: `The following subreddits already exist in other campaigns: ${duplicateSubreddits.map(d => `r/${d.subreddit} (in "${d.existingIn}")`).join(', ')}`
      }, { status: 409 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        subreddits: subreddits,
        keywords: keywords || [],
        excludeKeywords: excludeKeywords || [],
        minScore: minScore || 0,
        maxScore: maxScore || null,
        sortBy: sortBy || 'hot',
        timeRange: timeRange || 'day',
        includeNsfw: includeNsfw || false,
        postLimit: postLimit || 25,
        enabled: enabled !== false,
      },
    })

    logger.info({ campaignId: campaign.id }, 'Campaign created')

    return NextResponse.json({
      success: true,
      data: campaign,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to create campaign')
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}