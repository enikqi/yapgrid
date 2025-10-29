import { NextRequest, NextResponse } from 'next/server'
import { autoPoster } from '@/lib/auto-poster'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/posting-config-clear')

// POST /api/posting-config/clear-history - Clear posting history
export async function POST() {
  try {
    autoPoster.clearHistory()
    
    logger.info('Posting history cleared')
    
    return NextResponse.json({
      success: true,
      message: 'Posting history cleared successfully',
    })
  } catch (error) {
    logger.error({ error }, 'Failed to clear posting history')
    return NextResponse.json(
      { success: false, error: 'Failed to clear posting history' },
      { status: 500 }
    )
  }
}
