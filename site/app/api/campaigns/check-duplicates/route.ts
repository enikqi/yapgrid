import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/campaigns/check-duplicates')

// POST /api/campaigns/check-duplicates - Check for duplicate subreddits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subreddits } = body

    if (!subreddits || subreddits.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Subreddits array is required'
      }, { status: 400 })
    }

    // Get all existing campaigns
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

    // Get unique subreddits (not duplicates)
    const uniqueSubreddits = subreddits.filter(subreddit => 
      !existingSubredditMap.has(subreddit)
    )

    return NextResponse.json({
      success: true,
      data: {
        totalChecked: subreddits.length,
        duplicates: duplicateSubreddits,
        unique: uniqueSubreddits,
        duplicateCount: duplicateSubreddits.length,
        uniqueCount: uniqueSubreddits.length,
        canCreate: duplicateSubreddits.length === 0
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to check duplicates')
    return NextResponse.json(
      { success: false, error: 'Failed to check duplicates' },
      { status: 500 }
    )
  }
}
