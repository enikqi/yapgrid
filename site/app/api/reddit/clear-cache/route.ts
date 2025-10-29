import { NextRequest, NextResponse } from 'next/server'
import { redditClient } from '@/lib/reddit/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/reddit/clear-cache')

export async function POST(request: NextRequest) {
  try {
    logger.info('Clearing Reddit cache')
    
    // Clear the Reddit cache
    redditClient.clearCache()
    
    logger.info('Reddit cache cleared successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Reddit cache cleared successfully'
    })
  } catch (error) {
    logger.error({ error }, 'Failed to clear Reddit cache')
    return NextResponse.json(
      { success: false, error: 'Failed to clear Reddit cache' },
      { status: 500 }
    )
  }
}
