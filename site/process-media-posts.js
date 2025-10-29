const { PrismaClient } = require('@prisma/client')
const { MediaDownloader } = require('./lib/media/downloader')

const prisma = new PrismaClient()

async function processMediaPosts() {
  try {
    console.log('🎬 PROCESSING MEDIA POSTS - Downloading media assets')
    
    // Get READY posts that don't have assets yet
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: { none: {} }
      },
      orderBy: { createdUtc: 'asc' },
      take: 50
    })
    
    console.log(`📦 Found ${readyPosts.length} READY posts without assets`)
    
    if (readyPosts.length === 0) {
      console.log('✅ All READY posts already have assets!')
      return
    }
    
    const downloader = new MediaDownloader()
    let processed = 0
    
    for (const post of readyPosts) {
      try {
        console.log(`\n🔄 Processing: ${post.title.substring(0, 50)}...`)
        
        // Download media for this post
        const mediaInfo = await downloader.downloadMedia(post, post.id)
        
        if (mediaInfo) {
          // Save asset info to database
          let assetType = 'VIDEO'
          if (mediaInfo.type === 'image' || mediaInfo.type === 'gif') {
            assetType = 'THUMBNAIL'
          }
          
          await prisma.asset.create({
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
          
          processed++
          console.log(`  ✅ Media downloaded: ${mediaInfo.filename}`)
        } else {
          console.log(`  ❌ No media downloaded`)
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`)
      }
    }
    
    console.log(`\n🎉 PROCESSED ${processed} posts with media assets!`)
    
    // Show final status
    const readyWithMedia = await prisma.post.count({
      where: {
        status: 'READY',
        assets: { some: {} }
      }
    })
    
    const readyWithoutMedia = await prisma.post.count({
      where: {
        status: 'READY',
        assets: { none: {} }
      }
    })
    
    console.log(`\n📊 READY POSTS STATUS:`)
    console.log(`  📸 With media: ${readyWithMedia}`)
    console.log(`  📝 Without media: ${readyWithoutMedia}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

processMediaPosts()
