const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateAssetUrls() {
  try {
    console.log('🔄 Updating all LOCAL asset URLs to /api/media/...')
    
    // Get all LOCAL assets that need updating
    const assetsToUpdate = await prisma.asset.findMany({
      where: {
        storage: 'LOCAL',
        OR: [
          { url: { startsWith: '/media/' } },
          { url: null },
          { url: { not: { startsWith: '/api/media/' } } }
        ]
      }
    })
    
    console.log(`Found ${assetsToUpdate.length} assets to update`)
    
    let updated = 0
    let skipped = 0
    
    for (const asset of assetsToUpdate) {
      try {
        // Extract filename from pathOrKey
        const filename = asset.pathOrKey.split(/[/\\]/).pop() || asset.pathOrKey
        
        // Skip if already correct
        if (asset.url && asset.url === `/api/media/${filename}`) {
          skipped++
          continue
        }
        
        // Update to /api/media/ URL
        const newUrl = `/api/media/${filename}`
        
        await prisma.asset.update({
          where: { id: asset.id },
          data: { url: newUrl }
        })
        
        updated++
        
        if (updated % 100 === 0) {
          console.log(`  Updated ${updated}/${assetsToUpdate.length} assets...`)
        }
      } catch (error) {
        console.error(`  Error updating asset ${asset.id}:`, error.message)
      }
    }
    
    console.log(`\n✅ Updated ${updated} asset URLs`)
    console.log(`   Skipped ${skipped} (already correct)`)
    
    // Show summary
    const stats = await prisma.asset.groupBy({
      by: ['storage'],
      where: { storage: 'LOCAL' },
      _count: true
    })
    
    const withApiMedia = await prisma.asset.count({
      where: {
        storage: 'LOCAL',
        url: { startsWith: '/api/media/' }
      }
    })
    
    console.log(`\n📊 Final Stats:`)
    console.log(`   Total LOCAL assets: ${stats[0]?._count || 0}`)
    console.log(`   With /api/media/ URL: ${withApiMedia}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAssetUrls()

