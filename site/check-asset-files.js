const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAssetUrls() {
  try {
    console.log('🔍 Checking assets...')
    
    // Get assets with LOCAL storage
    const assets = await prisma.asset.findMany({
      where: {
        storage: 'LOCAL'
      },
      include: {
        post: true
      },
      take: 10
    })
    
    console.log(`📊 Found ${assets.length} LOCAL assets\n`)
    
    assets.forEach((asset, index) => {
      console.log(`${index + 1}. Asset:`)
      console.log(`   Post: ${asset.post.title.substring(0, 60)}...`)
      console.log(`   Type: ${asset.type}`)
      console.log(`   URL: ${asset.url}`)
      console.log(`   Path: ${asset.pathOrKey}`)
      console.log('')
    })
    
    // Count assets that have pathOrKey matching files in media/
    const fs = require('fs')
    const mediaFiles = fs.readdirSync('./media').map(f => f.toLowerCase())
    
    let matchedCount = 0
    let notMatchedCount = 0
    
    for (const asset of assets) {
      const fileName = asset.pathOrKey?.toLowerCase() || ''
      if (mediaFiles.includes(fileName)) {
        matchedCount++
      } else {
        notMatchedCount++
        console.log(`❌ File not found: ${asset.pathOrKey}`)
      }
    }
    
    console.log(`\n📊 Matched: ${matchedCount}`)
    console.log(`📊 Not Matched: ${notMatchedCount}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAssetUrls()




