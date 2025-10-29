const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function continuousProcessor() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] === CONTINUOUS PROCESSOR ===`)
    
    // Check how many NEW posts we have
    const newPostsCount = await prisma.post.count({
      where: { status: 'NEW' }
    })
    
    // Check how many READY posts we have
    const readyPostsCount = await prisma.post.count({
      where: { status: 'READY' }
    })
    
    console.log(`📊 Queue Status: ${newPostsCount} NEW posts, ${readyPostsCount} READY posts`)
    
    // If we have NEW posts and less than 50 READY posts, process more
    if (newPostsCount > 0 && readyPostsCount < 50) {
      const batchSize = Math.min(25, newPostsCount) // Process up to 25 posts at a time
      console.log(`🔄 Processing ${batchSize} posts to READY status...`)
      
      try {
        const response = await fetch('http://localhost:3002/api/posts/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchSize })
        })
        
        if (response.ok) {
          const result = await response.json()
          const processed = result.data?.processedCount || 0
          
          // Progress indicator
          const progress = Math.round((processed / batchSize) * 100)
          const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5))
          console.log(`  ${bar} ${progress}% - ${processed}/${batchSize} posts processed`)
          
          console.log(`✅ Processed ${processed} posts to READY status`)
        } else {
          console.log(`⚠️ Processing failed: ${response.status}`)
        }
      } catch (error) {
        console.log(`⚠️ Processing error: ${error.message}`)
      }
    } else if (readyPostsCount >= 50) {
      console.log(`✅ READY queue is full (${readyPostsCount} posts) - no processing needed`)
    } else {
      console.log(`📭 No NEW posts to process`)
    }
    
    // Show final status
    const finalCounts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('📊 Final Status:')
    finalCounts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`)
    })
    
  } catch (error) {
    console.error('❌ Continuous processor error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run immediately
continuousProcessor()

// Run every 30 seconds to keep READY queue filled
console.log('⚡ Continuous processor started - will run every 30 seconds')
setInterval(continuousProcessor, 30 * 1000)
