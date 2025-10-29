import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/posts-hide')

// POST /api/posts/hide - Hide a post for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if already hidden
    const existingHiddenPost = await prisma.hiddenPost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId
        }
      }
    })

    if (existingHiddenPost) {
      return NextResponse.json(
        { success: false, error: 'Post is already hidden' },
        { status: 400 }
      )
    }

    // Hide the post
    await prisma.hiddenPost.create({
      data: {
        userId: user.id,
        postId: postId
      }
    })

    logger.info({ userId: user.id, postId }, 'Post hidden successfully')

    return NextResponse.json({
      success: true,
      data: { message: 'Post hidden successfully', postId }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to hide post')
    return NextResponse.json(
      { success: false, error: 'Failed to hide post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/hide - Unhide a post for the current user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove the hidden post
    const deletedHiddenPost = await prisma.hiddenPost.deleteMany({
      where: {
        userId: user.id,
        postId: postId
      }
    })

    if (deletedHiddenPost.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Post is not hidden' },
        { status: 404 }
      )
    }

    logger.info({ userId: user.id, postId }, 'Post unhidden successfully')

    return NextResponse.json({
      success: true,
      data: { message: 'Post unhidden successfully', postId }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to unhide post')
    return NextResponse.json(
      { success: false, error: 'Failed to unhide post' },
      { status: 500 }
    )
  }
}
