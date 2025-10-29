import { PrismaClient } from '@prisma/client'
import { videoDownloader } from '@/lib/video/downloader'
import { saveFile } from '@/lib/storage'
import path from 'path'
import fs from 'fs/promises'
import { config } from '@/lib/config'
import { createLogger } from '@/lib/logger'

const logger = createLogger('redownload-video')

async function redownloadVideo() {
  const prisma = new PrismaClient()
  const postId = 'cmgxoulzm0cffvjqoj9xflbq9'

  try {
    // Get the post with its assets
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { assets: true }
    })

    if (!post) {
      logger.error(`Post ${postId} not found`)
      return
    }

    logger.info(`Found post: ${post.title}`)
    logger.info(`Original URL: ${post.url}`)

    // Delete existing video assets
    const videoAssets = post.assets.filter(a => a.type === 'VIDEO')
    for (const asset of videoAssets) {
      try {
        if (asset.storage === 'LOCAL' && asset.pathOrKey) {
          const fullPath = path.join(process.cwd(), 'public', asset.pathOrKey)
          await fs.unlink(fullPath).catch(() => {})
          logger.info(`Deleted old video file: ${asset.pathOrKey}`)
        }
        await prisma.asset.delete({ where: { id: asset.id } })
        logger.info(`Deleted asset record: ${asset.id}`)
      } catch (error) {
        logger.error({ error }, `Error deleting asset ${asset.id}`)
      }
    }

    // Download the video again
    logger.info('Starting video download...')
    const result = await videoDownloader.downloadVideo(post.url, postId, {
      maxDuration: 600, // 10 minutes
      maxFilesize: 500 * 1024 * 1024, // 500MB
      targetHeight: 1080
    })

    logger.info('Video downloaded successfully')
    logger.info(`Video path: ${result.videoPath}`)
    logger.info(`Thumbnail path: ${result.thumbnailPath}`)
    logger.info(`Metadata: ${JSON.stringify(result.metadata, null, 2)}`)

    // Create new asset records
    const videoAsset = await prisma.asset.create({
      data: {
        postId,
        type: 'VIDEO',
        storage: 'LOCAL',
        pathOrKey: result.videoPath.replace(/^\//, ''),
        url: `/${result.videoPath}`,
        width: result.metadata.width,
        height: result.metadata.height,
        durationSec: result.metadata.duration,
        filesize: result.metadata.filesize,
        mimeType: `video/${result.metadata.format}`
      }
    })

    logger.info('Created new video asset:', videoAsset.id)

    if (result.thumbnailPath) {
      await prisma.asset.create({
        data: {
          postId,
          type: 'THUMBNAIL',
          storage: 'LOCAL',
          pathOrKey: result.thumbnailPath.replace(/^\//, ''),
          url: `/${result.thumbnailPath}`,
          width: result.metadata.width,
          height: result.metadata.height
        }
      })
      logger.info('Created thumbnail asset')
    }

    // Update post status
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'PUBLISHED',
        error: null,
        updatedAt: new Date()
      }
    })

    logger.info('Post updated successfully')

  } catch (error) {
    logger.error({ error }, 'Error redownloading video')
    
    // Update post with error
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date()
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
redownloadVideo()
  .then(() => {
    console.log('Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
