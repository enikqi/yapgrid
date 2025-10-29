import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get client info
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      ...body
    }
    
    // Append to log file
    const logDir = path.join(process.cwd(), 'logs')
    const logFile = path.join(logDir, 'mobile-debug.log')
    
    // Ensure logs directory exists
    try {
      await fs.mkdir(logDir, { recursive: true })
    } catch (err) {
      // Directory might already exist
    }
    
    // Append log entry
    await fs.appendFile(
      logFile,
      JSON.stringify(logEntry) + '\n',
      'utf-8'
    )
    
    // Also log to console for real-time monitoring
    console.log('📱 Mobile Debug:', logEntry)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to log mobile debug:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log' },
      { status: 500 }
    )
  }
}
