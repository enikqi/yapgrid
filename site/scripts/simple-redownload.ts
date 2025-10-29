import { PrismaClient } from '@prisma/client'
import { videoDownloader } from '@/lib/video/downloader'
import { createLogger } from '@/lib/logger'
import path from 'path'
import fs from 'fs/promises'

const logger = createLogger('simple-redownload')

async function main() {
  const prisma = new PrismaClient()
  const postId = 'cmgxoulzm0cffvjqoj9xflbq9'

  try {
    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { assets: true }
    })

    if (!post) {
      logger.error(`Post ${postId} not found`)
      return
    }

    console.log(`Found post: ${post.title}`)
    console.log(`Original URL: ${post.url}`)

    // Download the video
    console.log('Starting video download...')
    const result = await videoDownloader.downloadVideo(post.url, postId, {
      maxDuration: 600, // 10 minutes
      maxFilesize: 500 * 1024 * 1024, // 500MB
      targetHeight: 1080
    })

    console.log('Video downloaded successfully')
    console.log(`Video path: ${result.videoPath}`)
    console.log(`Thumbnail path: ${result.thumbnailPath}`)
    console.log('Metadata:', JSON.stringify(result.metadata, null, 2))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main()
  .then(() => {
    console.log('Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
