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

    const { postId, postIds } = await request.json()
    
    // Handle batch processing
    if (postIds && Array.isArray(postIds)) {
      return handleBatchPostHistory(session.user.email, postIds)
    }
    
    // Handle single post
    if (!postId) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 })
    }

    return handleSinglePostHistory(session.user.email, postId)

  } catch (error) {
    console.error('Error adding post to history:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add post to history' 
    }, { status: 500 })
  }
}

async function handleSinglePostHistory(email: string, postId: string) {
  // Get user
  const user = await prisma.user.findUnique({
    where: { email }
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

  // Add to history (or update if exists)
  await prisma.postHistory.upsert({
    where: {
      userId_postId: {
        userId: user.id,
        postId: postId
      }
    },
    update: {
      createdAt: new Date()
    },
    create: {
      userId: user.id,
      postId: postId
    }
  })

  return NextResponse.json({ 
    success: true, 
    message: 'Post added to history' 
  })
}

async function handleBatchPostHistory(email: string, postIds: string[]) {
  // Get user
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  // Check which posts exist
  const existingPosts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true }
  })

  const validPostIds = existingPosts.map(p => p.id)

  if (validPostIds.length === 0) {
    return NextResponse.json({ success: true, message: 'No valid posts found' })
  }

  // Batch upsert post history
  const upsertPromises = validPostIds.map(postId =>
    prisma.postHistory.upsert({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId
        }
      },
      update: {
        createdAt: new Date()
      },
      create: {
        userId: user.id,
        postId: postId
      }
    })
  )

  await Promise.all(upsertPromises)

  return NextResponse.json({ 
    success: true, 
    message: `${validPostIds.length} posts added to history` 
  })
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

    // Get post history
    const postHistory = await prisma.postHistory.findMany({
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

    const total = await prisma.postHistory.count({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      data: {
        items: postHistory.map(ph => ph.post),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total
      }
    })

  } catch (error) {
    console.error('Error fetching post history:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch post history' 
    }, { status: 500 })
  }
}
