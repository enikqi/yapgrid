import { NextRequest, NextResponse } from 'next/server'
import { redditSessionManager } from '@/lib/reddit/session-manager'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/reddit-session')

// GET /api/reddit-session - Get session configuration
export async function GET() {
  try {
    const sessionConfig = await redditSessionManager.getSessionConfig()
    const isSessionValid = await redditSessionManager.testSession()
    
    return NextResponse.json({
      success: true,
      data: {
        sessionConfig,
        isSessionValid,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get session configuration')
    return NextResponse.json(
      { success: false, error: 'Failed to get session configuration' },
      { status: 500 }
    )
  }
}

// POST /api/reddit-session - Update session configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { sessionCookie, enabled } = body
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Session cookie is required' },
        { status: 400 }
      )
    }

    // Update session configuration
    await redditSessionManager.updateSessionConfig({
      sessionCookie,
      enabled: enabled !== false,
    })

    // Test the session
    const isSessionValid = await redditSessionManager.testSession()
    
    logger.info({ enabled, isValid: isSessionValid }, 'Reddit session configuration updated')

    return NextResponse.json({
      success: true,
      data: {
        sessionConfig: await redditSessionManager.getSessionConfig(),
        isSessionValid,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to update session configuration')
    return NextResponse.json(
      { success: false, error: 'Failed to update session configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/reddit-session - Delete session configuration
export async function DELETE() {
  try {
    await redditSessionManager.updateSessionConfig({
      sessionCookie: '',
      enabled: false,
    })
    
    logger.info('Reddit session configuration deleted')
    return NextResponse.json({ success: true, data: { message: 'Session configuration deleted' } })
  } catch (error) {
    logger.error({ error }, 'Failed to delete session configuration')
    return NextResponse.json(
      { success: false, error: 'Failed to delete session configuration' },
      { status: 500 }
    )
  }
}
