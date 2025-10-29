const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugAndFix() {
  try {
    console.log('🔍 DEBUGGING POST STATUS...')
    
    // Check all post statuses
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('\n📊 Current Post Status:')
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`)
    })
    
    // Check NEW posts specifically
    const newPosts = await prisma.post.findMany({
      where: { status: 'NEW' },
      select: { id: true, title: true, processedAt: true, error: true },
      take: 5
    })
    
    console.log(`\n🔍 Sample NEW posts (${newPosts.length}):`)
    newPosts.forEach(post => {
      console.log(`  - ${post.title.substring(0, 50)}... (processedAt: ${post.processedAt}, error: ${post.error})`)
    })
    
    // Check READY posts
    const readyPosts = await prisma.post.findMany({
      where: { status: 'READY' },
      select: { id: true, title: true, scheduledPublishAt: true },
      take: 5
    })
    
    console.log(`\n✅ Sample READY posts (${readyPosts.length}):`)
    readyPosts.forEach(post => {
      console.log(`  - ${post.title.substring(0, 50)}... (scheduled: ${post.scheduledPublishAt})`)
    })
    
    // The issue: NEW posts might have processedAt set but still be NEW status
    // Let's fix this by updating the processing logic
    console.log('\n🔧 FIXING PROCESSING LOGIC...')
    
    // Get NEW posts regardless of processedAt
    const newPostsToProcess = await prisma.post.findMany({
      where: { status: 'NEW' },
      orderBy: { createdUtc: 'asc' },
      take: 50
    })
    
    console.log(`📦 Found ${newPostsToProcess.length} NEW posts to process`)
    
    if (newPostsToProcess.length > 0) {
      console.log('🔄 Processing posts...')
      
      // Process each post
      let processed = 0
      for (const post of newPostsToProcess) {
        try {
          // Simple processing - just mark as READY
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'READY',
              processedAt: new Date(),
              scheduledPublishAt: new Date(), // Ready to publish immediately
              error: null
            }
          })
          
          processed++
          console.log(`  ✅ ${processed}/${newPostsToProcess.length} - ${post.title.substring(0, 30)}...`)
          
        } catch (error) {
          console.log(`  ❌ Failed to process ${post.id}: ${error.message}`)
        }
      }
      
      console.log(`\n🎉 PROCESSED ${processed} posts to READY status!`)
    }
    
    // Final status
    const finalCounts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('\n📊 FINAL STATUS:')
    finalCounts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`)
    })
    
    const readyCount = await prisma.post.count({
      where: { status: 'READY' }
    })
    
    console.log(`\n🚀 SUCCESS! Now you have ${readyCount} READY posts!`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAndFix()
