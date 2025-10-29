import { NextRequest, NextResponse } from 'next/server'
import { autoPoster } from '@/lib/auto-poster'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/posting-config-test')

// POST /api/posting-config/test - Test posting connection
export async function POST() {
  try {
    const isConnectionValid = await autoPoster.testConnection()
    
    return NextResponse.json({
      success: true,
      data: {
        isConnectionValid,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to test posting connection')
    return NextResponse.json(
      { success: false, error: 'Failed to test posting connection' },
      { status: 500 }
    )
  }
}
