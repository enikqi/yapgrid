import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await request.json()
    if (!postId) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    // Check if already saved
    const existingSavedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId
        }
      }
    })

    if (existingSavedPost) {
      return NextResponse.json({ success: false, error: 'Post already saved' }, { status: 400 })
    }

    // Save the post
    const savedPost = await prisma.savedPost.create({
      data: {
        userId: user.id,
        postId: postId
      },
      include: {
        post: {
          include: {
            assets: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: savedPost,
      message: 'Post saved successfully' 
    })

  } catch (error) {
    console.error('Error saving post:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save post' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await request.json()
    if (!postId) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Remove saved post
    await prisma.savedPost.deleteMany({
      where: {
        userId: user.id,
        postId: postId
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Post removed from saved' 
    })

  } catch (error) {
    console.error('Error removing saved post:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove saved post' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get saved posts
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: user.id },
      include: {
        post: {
          include: {
            assets: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    const total = await prisma.savedPost.count({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      data: {
        items: savedPosts.map(sp => sp.post),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total
      }
    })

  } catch (error) {
    console.error('Error fetching saved posts:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch saved posts' 
    }, { status: 500 })
  }
}
