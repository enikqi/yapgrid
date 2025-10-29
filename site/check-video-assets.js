const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkVideoAssets() {
  try {
    console.log('=== CHECKING VIDEO ASSETS ===')
    
    const assets = await prisma.asset.findMany({
      where: { type: 'VIDEO' },
      take: 5,
      include: { post: true }
    })
    
    console.log(`Found ${assets.length} video assets:`)
    assets.forEach(asset => {
      console.log(`- ${asset.pathOrKey}`)
      console.log(`  Post: ${asset.post?.title}`)
      console.log(`  URL: ${asset.url}`)
      console.log(`  Storage: ${asset.storage}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVideoAssets()
