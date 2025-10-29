const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function runAutoSystem() {
  try {
    console.log('=== RUNNING AUTO SYSTEM ===')
    
    // 1. Auto-fetching (run campaigns)
    console.log('\n1. Running auto-fetching...')
    const campaigns = await prisma.campaign.findMany({
      where: { enabled: true }
    })
    
    console.log(`Found ${campaigns.length} enabled campaigns`)
    
    for (const campaign of campaigns) {
      try {
        const response = await fetch(`http://localhost:3002/api/campaigns/${campaign.id}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const result = await response.json()
        
        if (result.success) {
          console.log(`✅ ${campaign.name}: Fetched ${result.data.postsSaved} posts`)
        } else {
          console.log(`❌ ${campaign.name}: ${result.error}`)
        }
      } catch (error) {
        console.log(`❌ ${campaign.name}: Error - ${error.message}`)
      }
    }
    
    // 2. Auto-processing (process NEW posts)
    console.log('\n2. Running auto-processing...')
    const newPosts = await prisma.post.findMany({
      where: { status: 'NEW' },
      take: 3,
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`Found ${newPosts.length} NEW posts to process`)
    
    for (const post of newPosts) {
      try {
        const response = await fetch(`http://localhost:3002/api/posts/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        })
        
        const result = await response.json()
        
        if (result.success) {
          console.log(`✅ Processed: ${post.title}`)
        } else {
          console.log(`❌ Failed: ${post.title} - ${result.error}`)
        }
      } catch (error) {
        console.log(`❌ Error processing ${post.title}: ${error.message}`)
      }
    }
    
    // 3. Auto-publishing (publish READY posts)
    console.log('\n3. Running auto-publishing...')
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: { some: {} }
      },
      take: 3,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Found ${readyPosts.length} READY posts with assets to publish`)
    
    if (readyPosts.length > 0) {
      try {
        const response = await fetch('http://localhost:3002/api/auto-publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postIds: readyPosts.map(p => p.id)
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          console.log(`✅ Published ${result.publishedCount} posts`)
        } else {
          console.log(`❌ Publishing failed: ${result.error}`)
        }
      } catch (error) {
        console.log(`❌ Error publishing: ${error.message}`)
      }
    }
    
    // 4. Status summary
    console.log('\n4. Final status:')
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    counts.forEach(count => {
      console.log(`- ${count.status}: ${count._count.id}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runAutoSystem()
