import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const logFile = path.join(process.cwd(), 'logs', 'mobile-debug.log')
    
    // Check if file exists
    try {
      await fs.access(logFile)
    } catch {
      // File doesn't exist yet
      return NextResponse.json({ logs: [] })
    }
    
    // Read log file
    const content = await fs.readFile(logFile, 'utf-8')
    
    // Parse log entries (each line is a JSON object)
    const logs = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .reverse() // Most recent first
    
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Failed to read mobile logs:', error)
    return NextResponse.json(
      { error: 'Failed to read logs' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const logFile = path.join(process.cwd(), 'logs', 'mobile-debug.log')
    
    // Delete log file
    try {
      await fs.unlink(logFile)
    } catch {
      // File might not exist
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete mobile logs:', error)
    return NextResponse.json(
      { error: 'Failed to delete logs' },
      { status: 500 }
    )
  }
}
