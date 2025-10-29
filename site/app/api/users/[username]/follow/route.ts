import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db/prisma'
import { authOptions } from '@/lib/auth'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/users/follow')

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const resolvedParams = await params
    const { username } = resolvedParams

    // Find the user to follow
    const userToFollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!userToFollow) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (userToFollow.id === session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Cannot follow yourself'
      }, { status: 400 })
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userToFollow.id
        }
      }
    })

    if (existingFollow) {
      return NextResponse.json({
        success: false,
        error: 'Already following this user'
      }, { status: 400 })
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: userToFollow.id
      }
    })

    logger.info({ followerId: session.user.id, followingId: userToFollow.id }, 'User followed')

    return NextResponse.json({
      success: true,
      message: 'Successfully followed user'
    })

  } catch (error) {
    logger.error({ error }, 'Failed to follow user')
    return NextResponse.json({
      success: false,
      error: 'Failed to follow user'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const resolvedParams = await params
    const { username } = resolvedParams

    // Find the user to unfollow
    const userToUnfollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!userToUnfollow) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Remove follow relationship
    await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: userToUnfollow.id
      }
    })

    logger.info({ followerId: session.user.id, followingId: userToUnfollow.id }, 'User unfollowed')

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed user'
    })

  } catch (error) {
    logger.error({ error }, 'Failed to unfollow user')
    return NextResponse.json({
      success: false,
      error: 'Failed to unfollow user'
    }, { status: 500 })
  }
}
