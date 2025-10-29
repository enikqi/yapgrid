import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/users')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const resolvedParams = await params
    const { username } = resolvedParams

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        karma: true,
        createdAt: true,
        isAdmin: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    const profile = {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      karma: user.karma,
      createdAt: user.createdAt.toISOString(),
      postsCount: user._count.posts,
      commentsCount: user._count.comments,
      isAdmin: user.isAdmin,
    }

    logger.info({ username }, 'User profile fetched')

    return NextResponse.json({
      success: true,
      data: profile
    })

  } catch (error) {
    logger.error({ error }, 'Failed to fetch user profile')
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile'
    }, { status: 500 })
  }
}
