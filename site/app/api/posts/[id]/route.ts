import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Fetch the post with all related data
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        status: 'PUBLISHED' // Only published posts
      },
      include: {
        assets: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        author: {
          select: {
            username: true,
            email: true
          }
        },
        subreddit: {
          select: {
            name: true,
            description: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Transform the data to match expected format
    const transformedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author?.username || 'unknown',
      subreddit: post.subreddit?.name || 'unknown',
      score: post.score,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      commentCount: post.commentCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      status: post.status,
      assets: post.assets.map(asset => ({
        id: asset.id,
        type: asset.type,
        url: asset.url,
        filename: asset.filename,
        mimeType: asset.mimeType,
        size: asset.size,
        createdAt: asset.createdAt.toISOString()
      }))
    }

    return NextResponse.json({
      success: true,
      data: transformedPost
    })

  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
