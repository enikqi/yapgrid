import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/admin/posts')

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      logger.warn({ session }, 'No session or email found')
      return NextResponse.json({ success: false, error: 'No session found' }, { status: 401 })
    }
    
    // Check if user is admin
    if (!session.user.isAdmin) {
      logger.warn({ email: session.user.email, isAdmin: session.user.isAdmin }, 'Unauthorized access attempt')
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { subreddit: { contains: search } }
      ]
    }

    // Get posts with pagination
    logger.info({ where, skip, limit }, 'Fetching posts from database')
    
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          assets: {
            select: {
              id: true,
              type: true,
              url: true
            }
          }
        }
      }),
      prisma.post.count({ where })
    ])

    logger.info({ postsCount: posts.length, totalPosts }, 'Posts fetched successfully')

    const totalPages = Math.ceil(totalPosts / limit)

    return NextResponse.json({
      success: true,
      data: {
        posts,
        totalPosts,
        totalPages,
        currentPage: page,
        hasMore: page < totalPages
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to fetch posts')
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch posts' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

