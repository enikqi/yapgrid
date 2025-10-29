const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAssetPaths() {
  try {
    console.log('=== CHECKING ASSET PATHS ===')
    
    const assets = await prisma.asset.findMany({
      where: { type: 'VIDEO' },
      take: 3,
      select: {
        pathOrKey: true,
        url: true,
        storage: true
      }
    })
    
    console.log('Asset paths:')
    assets.forEach(asset => {
      console.log(`- pathOrKey: "${asset.pathOrKey}"`)
      console.log(`- url: "${asset.url}"`)
      console.log(`- storage: ${asset.storage}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAssetPaths()
