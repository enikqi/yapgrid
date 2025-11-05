import { NextRequest, NextResponse } from 'next/server'

// Custom error handler for NextAuth to return JSON instead of HTML
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const error = searchParams.get('error')
  
  return NextResponse.json({
    success: false,
    error: error || 'Authentication error'
  }, { status: 401 })
}

