import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db/prisma'
import { authOptions } from '@/lib/auth'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/posts/create')

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { title, content, url, subreddit, type, fileUrl } = await request.json()

    // Validate required fields
    if (!title || !subreddit) {
      return NextResponse.json({
        success: false,
        error: 'Title and subreddit are required'
      }, { status: 400 })
    }

    if (type === 'LINK' && !url) {
      return NextResponse.json({
        success: false,
        error: 'URL is required for link posts'
      }, { status: 400 })
    }

    // Validate URL format for link posts
    if (type === 'LINK' && url) {
      try {
        new URL(url.trim())
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Invalid URL format'
        }, { status: 400 })
      }
    }

    if ((type === 'IMAGE' || type === 'VIDEO') && !fileUrl) {
      return NextResponse.json({
        success: false,
        error: 'File upload is required for image/video posts'
      }, { status: 400 })
    }

    // Validate subreddit format
    const subredditRegex = /^[a-zA-Z0-9_]+$/
    if (!subredditRegex.test(subreddit)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subreddit name'
      }, { status: 400 })
    }

    // Create the post
    const post = await prisma.userPost.create({
      data: {
        title: title.trim(),
        content: content?.trim() || null,
        type: type || 'TEXT',
        subreddit: subreddit.toLowerCase(),
        authorId: session.user.id,
        score: 0,
        commentsCount: 0,
        isNsfw: false,
        isPinned: false,
        isLocked: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          }
        }
      }
    })

    // Create assets based on post type
    if (type === 'LINK' && url) {
      await prisma.userPostAsset.create({
        data: {
          postId: post.id,
          type: 'LINK',
          url: url.trim(),
        }
      })
    } else if ((type === 'IMAGE' || type === 'VIDEO') && fileUrl) {
      await prisma.userPostAsset.create({
        data: {
          postId: post.id,
          type: type === 'IMAGE' ? 'IMAGE' : 'VIDEO',
          url: fileUrl,
        }
      })
    }

    logger.info({ 
      postId: post.id, 
      authorId: session.user.id, 
      subreddit: post.subreddit 
    }, 'Post created successfully')

    return NextResponse.json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type,
        subreddit: post.subreddit,
        score: post.score,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
        author: post.author,
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to create post')
    return NextResponse.json({
      success: false,
      error: 'Failed to create post'
    }, { status: 500 })
  }
}
