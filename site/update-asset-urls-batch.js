const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const path = require('path')

async function updateAssetUrlsBatch() {
  try {
    console.log('🔄 Updating asset URLs and cleaning database...')
    
    let totalUpdated = 0
    let totalDeleted = 0
    let offset = 0
    const batchSize = 500
    
    while (true) {
      // Get batch of assets
      const assets = await prisma.asset.findMany({
        where: {
          storage: 'LOCAL'
        },
        take: batchSize,
        skip: offset
      })
      
      if (assets.length === 0) break
      
      console.log(`Processing batch ${Math.floor(offset / batchSize) + 1} (${assets.length} assets)...`)
      
      for (const asset of assets) {
        try {
          // Check if file exists in media folder
          const mediaPath = path.join(__dirname, 'media', asset.pathOrKey)
          
          if (fs.existsSync(mediaPath)) {
            // Update URL to point to local media
            const newUrl = `/media/${asset.pathOrKey}`
            
            await prisma.asset.update({
              where: { id: asset.id },
              data: { url: newUrl }
            })
            
            totalUpdated++
          } else {
            // Delete asset if file doesn't exist
            await prisma.asset.delete({
              where: { id: asset.id }
            })
            
            totalDeleted++
          }
        } catch (error) {
          console.error(`Error processing asset ${asset.id}:`, error.message)
        }
      }
      
      offset += batchSize
      console.log(`Progress: Updated ${totalUpdated}, Deleted ${totalDeleted}`)
    }
    
    console.log(`\n✅ Updated ${totalUpdated} assets`)
    console.log(`🗑️  Deleted ${totalDeleted} assets (missing files)`)
    
    // Now delete posts that have no assets
    console.log('\n🗑️  Checking for posts without assets...')
    
    const postsWithoutAssets = await prisma.post.findMany({
      where: {
        assets: {
          none: {}
        }
      },
      take: 1000
    })
    
    if (postsWithoutAssets.length > 0) {
      await prisma.post.deleteMany({
        where: {
          assets: {
            none: {}
          }
        }
      })
      console.log(`🗑️  Deleted posts without assets`)
    }
    
    // Show final stats
    const remainingPosts = await prisma.post.count()
    const remainingAssets = await prisma.asset.count()
    const localAssets = await prisma.asset.count({
      where: {
        storage: 'LOCAL',
        url: {
          startsWith: '/media/'
        }
      }
    })
    
    console.log(`\n📊 Final Stats:`)
    console.log(`   Posts: ${remainingPosts}`)
    console.log(`   Assets: ${remainingAssets}`)
    console.log(`   Assets with local URLs: ${localAssets}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAssetUrlsBatch()



