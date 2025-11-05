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
      logger.warn('No session or email found', { session })
      return NextResponse.json({ success: false, error: 'No session found' }, { status: 401 })
    }
    
    // Check if user is admin
    const user = session.user as any
    if (!user.isAdmin) {
      logger.warn('Unauthorized access attempt', { email: session.user.email, isAdmin: user.isAdmin })
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
    logger.info('Fetching posts from database', { where, skip, limit })
    
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

    logger.info('Posts fetched successfully', { postsCount: posts.length, totalPosts })

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
    logger.error('Failed to fetch posts', { error })
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch posts' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

