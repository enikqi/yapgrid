import { NextRequest, NextResponse } from 'next/server'
import { autoPoster } from '@/lib/auto-poster'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/posting-config')

// GET /api/posting-config - Get posting configuration
export async function GET() {
  try {
    const postingConfig = autoPoster.getConfig()
    const postingStats = autoPoster.getPostingStats()
    const postedContent = autoPoster.getPostedContent()
    
    return NextResponse.json({
      success: true,
      data: {
        postingConfig,
        postingStats,
        recentPosts: postedContent.slice(-10), // Last 10 posts
      },
    })
  } catch (error) {
    logger.error('Failed to get posting configuration', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get posting configuration' },
      { status: 500 }
    )
  }
}

// POST /api/posting-config - Update posting configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { targetUrl, username, password, apiKey, contentType, customEndpoint, enabled } = body
    
    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Target URL is required' },
        { status: 400 }
      )
    }

    // Configure auto-poster
    autoPoster.configure({
      targetUrl,
      username,
      password,
      apiKey,
      contentType: contentType || 'wordpress',
      customEndpoint,
      enabled: enabled !== false,
    })

    // Test connection
    const isConnectionValid = await autoPoster.testConnection()
    
    logger.info({ targetUrl, contentType, enabled, isValid: isConnectionValid }, 'Posting configuration updated')

    return NextResponse.json({
      success: true,
      data: {
        isConnectionValid,
        message: 'Posting configuration updated successfully',
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to update posting configuration')
    return NextResponse.json(
      { success: false, error: 'Failed to update posting configuration' },
      { status: 500 }
    )
  }
}
