const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixReadyPosts() {
  try {
    console.log('🔧 FIXING READY POSTS - Processing NEW posts to READY status')
    
    // Get count of NEW posts
    const newCount = await prisma.post.count({
      where: { status: 'NEW' }
    })
    
    console.log(`📊 Found ${newCount} NEW posts waiting to be processed`)
    
    if (newCount === 0) {
      console.log('✅ No NEW posts to process')
      return
    }
    
    // Process posts in batches of 50
    const batchSize = 50
    const totalBatches = Math.ceil(newCount / batchSize)
    
    console.log(`🔄 Processing ${totalBatches} batches of ${batchSize} posts each...`)
    
    for (let batch = 1; batch <= totalBatches; batch++) {
      console.log(`\n📦 Batch ${batch}/${totalBatches}:`)
      
      try {
        const response = await fetch('http://localhost:3002/api/posts/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchSize })
        })
        
        if (response.ok) {
          const result = await response.json()
          const processed = result.data?.processedCount || 0
          
          // Progress bar
          const progress = Math.round((batch / totalBatches) * 100)
          const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5))
          console.log(`  ${bar} ${progress}% - ${processed} posts processed`)
          
          if (processed === 0) {
            console.log('  ✅ No more posts to process - all done!')
            break
          }
        } else {
          console.log(`  ❌ Batch failed: ${response.status}`)
        }
      } catch (error) {
        console.log(`  ❌ Batch error: ${error.message}`)
      }
      
      // Small delay between batches
      if (batch < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Show final status
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('\n📊 FINAL STATUS:')
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`)
    })
    
    const readyCount = await prisma.post.count({
      where: { status: 'READY' }
    })
    
    console.log(`\n🎉 SUCCESS! Now you have ${readyCount} READY posts for auto-publishing!`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixReadyPosts()
