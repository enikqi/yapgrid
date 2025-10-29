const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAssets() {
  try {
    console.log('🔍 Checking assets in database...')
    
    // Get some posts with assets
    const posts = await prisma.post.findMany({
      where: {
        assets: {
          some: {}
        }
      },
      take: 5,
      include: {
        assets: true
      }
    })

    console.log(`📊 Found ${posts.length} posts with assets\n`)
    
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. Post: ${post.title.substring(0, 60)}...`)
      console.log(`   Status: ${post.status}`)
      console.log(`   Assets: ${post.assets.length}`)
      
      post.assets.forEach((asset, assetIndex) => {
        console.log(`   Asset ${assetIndex + 1}:`)
        console.log(`     - Type: ${asset.type}`)
        console.log(`     - URL: ${asset.url}`)
        console.log(`     - Path: ${asset.pathOrKey}`)
      })
    })

    // Count total assets
    const totalAssets = await prisma.asset.count()
    console.log(`\n📊 Total assets in database: ${totalAssets}`)
    
    // Check how many assets have URLs matching the old timestamp pattern
    const assetsWithOldPattern = await prisma.asset.count({
      where: {
        url: {
          contains: '/media/'
        }
      }
    })
    
    console.log(`📊 Assets with media URLs: ${assetsWithOldPattern}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAssets()
