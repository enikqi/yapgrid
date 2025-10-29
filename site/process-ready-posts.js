const { PrismaClient } = require('@prisma/client')
const { MediaDownloader } = require('./lib/media/downloader')

const prisma = new PrismaClient()

async function processReadyPosts() {
  try {
    console.log('Processing READY posts to download media...')
    
    // Get READY posts
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY'
      },
      take: 3,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${readyPosts.length} READY posts to process`)
    
    const downloader = new MediaDownloader()
    
    for (const post of readyPosts) {
      console.log(`\nProcessing: ${post.title}`)
      console.log(`URL: ${post.url}`)
      
      try {
        // Download media for this post
        const mediaInfo = await downloader.downloadMedia(post, post.id)
        
        if (mediaInfo) {
          console.log(`✅ Media downloaded: ${mediaInfo.type}`)
          console.log(`   File: ${mediaInfo.filename}`)
          console.log(`   Size: ${mediaInfo.size} bytes`)
          
          // Map media type to AssetType enum
          let assetType = 'VIDEO'
          if (mediaInfo.type === 'image' || mediaInfo.type === 'gif') {
            assetType = 'THUMBNAIL'
          }
          
          // Save media info to database
          const asset = await prisma.asset.create({
            data: {
              postId: post.id,
              type: assetType,
              storage: 'LOCAL',
              pathOrKey: mediaInfo.filename,
              width: mediaInfo.width,
              height: mediaInfo.height,
              durationSec: mediaInfo.duration,
              filesize: mediaInfo.size,
              url: mediaInfo.url,
            },
          })
          
          console.log(`✅ Asset created: ${asset.type}`)
          
        } else {
          console.log(`❌ No media info returned`)
        }
        
        // Wait between downloads
        await new Promise(resolve => setTimeout(resolve, 3000))
        
      } catch (error) {
        console.log(`❌ Error processing ${post.title}:`, error.message)
      }
    }
    
    console.log('\nProcessing completed!')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

processReadyPosts()

