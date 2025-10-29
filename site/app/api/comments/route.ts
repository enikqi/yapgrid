import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const parentId = searchParams.get('parentId') // For replies

    if (!postId) {
      return NextResponse.json({ 
        success: false, 
        error: 'postId is required' 
      }, { status: 400 })
    }

    // Get comments for the post
    const comments = await prisma.comment.findMany({
      where: {
        postId: postId,
        parentId: parentId || null, // Top-level comments if no parentId
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            karma: true
          }
        },
        votes: {
          select: {
            userId: true,
            type: true
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate vote scores for each comment
    const commentsWithScores = comments.map(comment => {
      const upvotes = comment.votes.filter(vote => vote.type === 'UPVOTE').length
      const downvotes = comment.votes.filter(vote => vote.type === 'DOWNVOTE').length
      const score = upvotes - downvotes

      return {
        ...comment,
        score,
        upvotes,
        downvotes,
        repliesCount: comment._count.replies
      }
    })

    return NextResponse.json({
      success: true,
      data: commentsWithScores
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, content, parentId } = await request.json()

    if (!postId || !content || content.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'postId and content are required' 
      }, { status: 400 })
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    // If it's a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      })

      if (!parentComment) {
        return NextResponse.json({ success: false, error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        postId: postId,
        parentId: parentId || null,
        score: 0
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            karma: true
          }
        }
      }
    })

    // Update post comment count
    await prisma.post.update({
      where: { id: postId },
      data: {
        commentsCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...comment,
        score: 0,
        upvotes: 0,
        downvotes: 0,
        repliesCount: 0
      }
    })

  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'commentId is required' 
      }, { status: 400 })
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check if comment exists and belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 })
    }

    if (comment.authorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Soft delete the comment
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
