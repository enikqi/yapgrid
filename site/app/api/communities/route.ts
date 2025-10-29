import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all unique subreddits from posts
    const subreddits = await prisma.post.groupBy({
      by: ['subreddit'],
      where: {
        status: 'PUBLISHED',
        subreddit: {
          contains: search.toLowerCase()
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    })

    // Also get user-created communities
    const userCommunities = await prisma.userPost.groupBy({
      by: ['subreddit'],
      where: {
        subreddit: {
          contains: search.toLowerCase()
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    })

    // Combine and deduplicate communities
    const allCommunities = new Map()
    
    // Add Reddit communities
    subreddits.forEach(community => {
      allCommunities.set(community.subreddit, {
        name: community.subreddit,
        postsCount: community._count.id,
        type: 'reddit'
      })
    })

    // Add user communities
    userCommunities.forEach(community => {
      const existing = allCommunities.get(community.subreddit)
      if (existing) {
        existing.postsCount += community._count.id
        existing.type = 'mixed'
      } else {
        allCommunities.set(community.subreddit, {
          name: community.subreddit,
          postsCount: community._count.id,
          type: 'user'
        })
      }
    })

    const communities = Array.from(allCommunities.values())
      .sort((a, b) => b.postsCount - a.postsCount)

    return NextResponse.json({
      success: true,
      data: {
        communities,
        total: communities.length
      }
    })

  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch communities'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Community name is required'
      }, { status: 400 })
    }

    const communityName = name.trim().toLowerCase()

    // Validate community name format
    const nameRegex = /^[a-zA-Z0-9_]+$/
    if (!nameRegex.test(communityName)) {
      return NextResponse.json({
        success: false,
        error: 'Community name can only contain letters, numbers, and underscores'
      }, { status: 400 })
    }

    // Check if community already exists
    const existingCommunity = await prisma.post.findFirst({
      where: {
        subreddit: communityName
      }
    })

    if (existingCommunity) {
      return NextResponse.json({
        success: false,
        error: 'Community already exists'
      }, { status: 400 })
    }

    // For now, just return success - the community will be created when first post is made
    return NextResponse.json({
      success: true,
      data: {
        name: communityName,
        description: description || '',
        message: 'Community will be created when you post to it'
      }
    })

  } catch (error) {
    console.error('Error creating community:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create community'
    }, { status: 500 })
  }
}
