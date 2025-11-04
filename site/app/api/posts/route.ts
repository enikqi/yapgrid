import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import type { ApiResponse, PaginatedResponse, Post, Asset } from '@/lib/types'

const logger = createLogger('api/posts')

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const requestedPageSize = parseInt(searchParams.get('pageSize') || '20')
    // Limit page size to prevent performance issues (max 100)
    const pageSize = Math.min(100, Math.max(1, requestedPageSize))
    const status = searchParams.get('status') || 'NEW'
    const subreddit = searchParams.get('subreddit')
    const includeNsfw = searchParams.get('includeNsfw') === 'true'
    const sortBy = searchParams.get('sortBy') || 'publishedAt'
    const assetType = searchParams.get('assetType')
    const hiddenPostIds = searchParams.get('hiddenPostIds') // For localStorage hidden posts

    const skip = (page - 1) * pageSize

    // Get user session to filter hidden posts
    const session = await getServerSession(authOptions)
    let userId = null
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      userId = user?.id
    }

    // Build where clause
    const where: any = {
      status: status as any,
    }

    if (subreddit) {
      where.subreddit = subreddit
    }

    if (!includeNsfw) {
      where.nsfw = false
    }

    // Filter out hidden posts if user is authenticated
    if (userId) {
      where.hiddenPosts = {
        none: {
          userId: userId
        }
      }
    }

    // Filter out localStorage hidden posts for non-signed-in users
    if (hiddenPostIds) {
      const hiddenIds = hiddenPostIds.split(',').filter(id => id.trim())
      if (hiddenIds.length > 0) {
        where.id = {
          notIn: hiddenIds
        }
      }
    }

    // For PUBLISHED posts, show both posts with assets and text-only posts
    if (status === 'PUBLISHED') {
      // Allow posts with assets OR text-only posts (no assets needed)
      where.OR = [
        { assets: { some: {} } }, // Posts with assets
        { 
          AND: [
            { assets: { none: {} } }, // No assets
            { url: { contains: '/comments/' } }, // Text posts (Reddit comments)
            { url: { not: { contains: 'i.redd.it' } } }, // Not image posts
            { url: { not: { contains: 'v.redd.it' } } }, // Not video posts
            { url: { not: { contains: '/gallery/' } } } // Not gallery posts
          ]
        }
      ]
    }

    // Filter by asset type if specified
    if (assetType) {
      // For images filter: include posts with THUMBNAIL but exclude posts with VIDEO
      // This ensures that posts with both THUMBNAIL and VIDEO don't appear in the images feed
      if (assetType === 'THUMBNAIL') {
        where.assets = {
          some: {
            type: assetType as any
          }
        }
        where.NOT = {
          assets: {
            some: {
              type: 'VIDEO' as any
            }
          }
        }
      } else {
        // For other asset types (like VIDEO): simple filter
        where.assets = {
          some: {
            type: assetType as any
          }
        }
      }
    }

    // Test database connection first
    await prisma.$connect()

    // Get posts with assets
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          assets: true,
        },
        orderBy: (() => {
          switch (sortBy) {
            case 'score':
              return { score: 'desc' }
            case 'publishedAt':
              return { publishedAt: 'desc' }
            case 'createdUtc':
              return { createdUtc: 'desc' }
            default:
              return status === 'PUBLISHED' 
                ? { publishedAt: 'desc' }
                : { createdUtc: 'desc' }
          }
        })(),
        skip,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ])

    // Transform asset URLs if needed
    const transformedPosts = await Promise.all(
      posts.map(async (post) => {
        const transformedAssets = await Promise.all(
          post.assets.map(async (asset) => {
            // If local storage, use local media route
            if (asset.storage === 'LOCAL') {
              // Extract just the filename from the path (handle both Windows and Unix paths)
              const filename = asset.pathOrKey.split(/[/\\]/).pop() || asset.pathOrKey
              asset.url = `/api/media/${encodeURIComponent(filename)}`
            }
            return asset
          })
        )
        return {
          ...post,
          assets: transformedAssets,
        }
      })
    )

    const response: ApiResponse<PaginatedResponse<Post & { assets: Asset[] }>> = {
      success: true,
      data: {
        items: transformedPosts,
        total,
        page,
        pageSize,
        hasMore: skip + pageSize < total,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to fetch posts')
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch posts',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { redditId, title, author, subreddit, permalink, score, nsfw, createdUtc } = body
    
    if (!redditId || !title || !author || !subreddit || !permalink) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields',
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Check if post already exists
    const existing = await prisma.post.findUnique({
      where: { redditId },
    })

    if (existing) {
      const response: ApiResponse = {
        success: false,
        error: 'Post already exists',
      }
      return NextResponse.json(response, { status: 409 })
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        redditId,
        title,
        author,
        subreddit,
        permalink,
        score: score || 0,
        nsfw: nsfw || false,
        createdUtc: new Date(createdUtc * 1000),
      },
    })

    logger.info({ postId: post.id, redditId }, 'Post created')

    const response: ApiResponse<Post> = {
      success: true,
      data: post,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Failed to create post')
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create post',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
