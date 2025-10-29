import { NextRequest, NextResponse } from 'next/server'
import { redditSessionManager } from '@/lib/reddit/session-manager'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/reddit-session-test')

// POST /api/reddit-session/test - Test session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionCookie } = body
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Session cookie is required' },
        { status: 400 }
      )
    }
    
    // Set the session cookie temporarily for testing
    redditSessionManager.setSessionCookie(sessionCookie)
    
    const isSessionValid = await redditSessionManager.testSession()
    
    return NextResponse.json({
      success: true,
      data: {
        isSessionValid,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to test session')
    return NextResponse.json(
      { success: false, error: 'Failed to test session' },
      { status: 500 }
    )
  }
}
