import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get READY posts with their assets
    const posts = await prisma.post.findMany({
      where: {
        status: 'READY',
      },
      select: {
        id: true,
        title: true,
        url: true,
        subreddit: true,
        score: true,
        scheduledPublishAt: true,
        preview: true,
        assets: {
          select: {
            type: true,
          },
        },
      },
      orderBy: {
        scheduledPublishAt: 'asc', // Show earliest scheduled first
      },
      take: 100, // Limit to 100 most recent
    })

    return NextResponse.json({
      success: true,
      data: {
        posts,
        count: posts.length,
      },
    })
  } catch (error) {
    console.error('Failed to fetch ready posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ready posts' },
      { status: 500 }
    )
  }
}

