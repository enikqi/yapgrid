const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const path = require('path')

async function updateAssetUrls() {
  try {
    console.log('🔄 Updating asset URLs and deleting missing files...')
    
    // Get all assets with LOCAL storage
    const assets = await prisma.asset.findMany({
      where: {
        storage: 'LOCAL'
      }
    })
    
    console.log(`📊 Found ${assets.length} LOCAL assets`)
    
    let updatedCount = 0
    let deletedCount = 0
    let errorCount = 0
    
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
          
          updatedCount++
          
          if (updatedCount <= 5) {
            console.log(`✅ Updated: ${asset.pathOrKey} -> ${newUrl}`)
          }
        } else {
          // Delete asset if file doesn't exist
          console.log(`🗑️  Deleting asset (file not found): ${asset.pathOrKey}`)
          
          await prisma.asset.delete({
            where: { id: asset.id }
          })
          
          deletedCount++
        }
      } catch (error) {
        console.error(`Error processing asset ${asset.pathOrKey}:`, error.message)
        errorCount++
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} assets`)
    console.log(`🗑️  Deleted ${deletedCount} assets (missing files)`)
    if (errorCount > 0) {
      console.log(`❌ ${errorCount} errors`)
    }
    
    // Now delete posts that have no assets
    console.log('\n🗑️  Checking for posts without assets...')
    
    const postsWithoutAssets = await prisma.post.findMany({
      where: {
        assets: {
          none: {}
        }
      }
    })
    
    console.log(`📊 Found ${postsWithoutAssets.length} posts without assets`)
    
    if (postsWithoutAssets.length > 0) {
      await prisma.post.deleteMany({
        where: {
          assets: {
            none: {}
          }
        }
      })
      console.log(`🗑️  Deleted ${postsWithoutAssets.length} posts without assets`)
    }
    
    // Show final stats
    const remainingPosts = await prisma.post.count()
    const remainingAssets = await prisma.asset.count()
    
    console.log(`\n📊 Final Stats:`)
    console.log(`   Posts: ${remainingPosts}`)
    console.log(`   Assets: ${remainingAssets}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAssetUrls()