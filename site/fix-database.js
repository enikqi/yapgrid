const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const path = require('path')

async function fixDatabase() {
  try {
    console.log('🔄 Starting database cleanup...')
    
    // Step 1: Get all files in media directory
    console.log('\n📁 Reading media files...')
    const mediaFiles = fs.readdirSync(path.join(__dirname, 'media'))
    const mediaFileSet = new Set(mediaFiles.map(f => f.toLowerCase()))
    
    console.log(`Found ${mediaFiles.length} files in media directory`)
    
    // Step 2: Get all assets with LOCAL storage
    console.log('\n📊 Fetching assets from database...')
    const assets = await prisma.asset.findMany({
      where: {
        storage: 'LOCAL'
      },
      include: {
        post: true
      }
    })
    
    console.log(`Found ${assets.length} LOCAL assets`)
    
    // Step 3: Process assets
    console.log('\n🔍 Processing assets...')
    let validAssets = 0
    let invalidAssets = 0
    
    for (const asset of assets) {
      const fileName = asset.pathOrKey?.toLowerCase()
      
      if (fileName && mediaFileSet.has(fileName)) {
        // File exists, update URL
        const newUrl = `/media/${asset.pathOrKey}`
        
        await prisma.asset.update({
          where: { id: asset.id },
          data: { url: newUrl }
        })
        
        validAssets++
      } else {
        // File doesn't exist, delete asset
        await prisma.asset.delete({
          where: { id: asset.id }
        })
        
        invalidAssets++
      }
      
      if ((validAssets + invalidAssets) % 1000 === 0) {
        console.log(`Processed ${validAssets + invalidAssets} assets...`)
      }
    }
    
    console.log(`\n✅ Updated ${validAssets} valid assets`)
    console.log(`🗑️  Deleted ${invalidAssets} assets (file not found)`)
    
    // Step 4: Delete posts without assets
    console.log('\n🗑️  Cleaning up posts without assets...')
    
    const deleteResult = await prisma.post.deleteMany({
      where: {
        assets: {
          none: {}
        }
      }
    })
    
    console.log(`🗑️  Deleted ${deleteResult.count} posts without assets`)
    
    // Step 5: Final stats
    const remainingPosts = await prisma.post.count()
    const remainingAssets = await prisma.asset.count()
    const postsWithAssets = await prisma.post.count({
      where: {
        assets: {
          some: {}
        }
      }
    })
    
    console.log(`\n📊 Final Database Status:`)
    console.log(`   Posts: ${remainingPosts}`)
    console.log(`   Posts with assets: ${postsWithAssets}`)
    console.log(`   Assets: ${remainingAssets}`)
    
    console.log('\n✅ Database cleanup complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDatabase()



