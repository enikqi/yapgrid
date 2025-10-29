import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

const logger = createLogger('api/posts-delete')

// DELETE /api/posts/delete - Delete a post and its assets
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
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

    // Get the post with its assets
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        assets: true,
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Delete associated media files
    const mediaDir = './media'
    for (const asset of post.assets) {
      if (asset.pathOrKey) {
        try {
          const filePath = path.join(mediaDir, asset.pathOrKey)
          await fs.unlink(filePath)
          logger.info({ assetId: asset.id, filePath }, 'Media file deleted')
        } catch (error) {
          logger.warn({ assetId: asset.id, error }, 'Failed to delete media file')
        }
      }
    }

    // Delete the post (this will cascade delete assets, saved posts, history, etc.)
    await prisma.post.delete({
      where: { id: postId },
    })

    logger.info({ postId, title: post.title }, 'Post deleted successfully')

    return NextResponse.json({
      success: true,
      data: {
        message: 'Post deleted successfully',
        postId,
        title: post.title,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to delete post')
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
