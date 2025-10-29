import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()
    const logPath = path.join(process.cwd(), 'video-errors.log')
    const timestamp = new Date().toISOString()
    
    const logEntry = `${timestamp} - ${JSON.stringify(errorData)}\n`
    
    await fs.appendFile(logPath, logEntry)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

