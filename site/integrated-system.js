const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function integratedSystem() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] === INTEGRATED SYSTEM RUN ===`)

    // 1. Auto-fetch new posts
    console.log('1. Running auto-fetch...')
    try {
      const response = await fetch('http://localhost:3002/api/campaigns/run-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Auto-fetch: ${result.data?.totalSaved || 0} posts saved`)
      }
    } catch (error) {
      console.log('⚠️ Auto-fetch failed:', error.message)
    }

    // 2. Auto-process NEW posts
    console.log('2. Running auto-processing...')
    try {
      const response = await fetch('http://localhost:3002/api/posts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 3 })
      })
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Auto-processing: ${result.data?.processedCount || 0} posts processed`)
      }
    } catch (error) {
      console.log('⚠️ Auto-processing failed:', error.message)
    }

    // 3. Auto-publish READY posts with assets
    console.log('3. Running auto-publishing...')
    try {
      const response = await fetch('http://localhost:3002/api/auto-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Auto-publishing: ${result.data?.publishedCount || 0} posts published`)
      }
    } catch (error) {
      console.log('⚠️ Auto-publishing failed:', error.message)
    }

    // 4. Show current status
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('\n📊 Current Status:')
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`)
    })

    const readyWithAssets = await prisma.post.count({
      where: {
        status: 'READY',
        assets: { some: {} }
      }
    })
    console.log(`  READY with assets: ${readyWithAssets}`)

  } catch (error) {
    console.error('❌ System error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run immediately
integratedSystem()

// Run every 2 minutes
console.log('🚀 Integrated system started - will run every 2 minutes')
setInterval(integratedSystem, 2 * 60 * 1000)

