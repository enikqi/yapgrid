const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function processAllReadyPosts() {
  try {
    console.log('=== PROCESSING ALL READY POSTS ===')
    
    // Get all READY posts without assets
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: {
          none: {}
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${readyPosts.length} READY posts without assets`)
    
    if (readyPosts.length === 0) {
      console.log('No READY posts to process')
      return
    }
    
    let processed = 0
    let failed = 0
    
    for (const post of readyPosts) {
      console.log(`Processing ${processed + failed + 1}/${readyPosts.length}: ${post.title}`)
      
      try {
        const response = await fetch('http://localhost:3002/api/media/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: post.id,
            url: post.url
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Success: ${post.title}`)
          processed++
        } else {
          console.log(`❌ Failed: ${post.title}`)
          failed++
        }
      } catch (error) {
        console.log(`❌ Error: ${post.title} - ${error.message}`)
        failed++
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`\nProcessing complete: ${processed} successful, ${failed} failed`)
    
  } catch (error) {
    console.error('Error in processAllReadyPosts:', error)
  }
}

async function publishAllReadyPosts() {
  try {
    console.log('\n=== PUBLISHING ALL READY POSTS WITH ASSETS ===')
    
    // Get all READY posts with assets
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: {
          some: {}
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${readyPosts.length} READY posts with assets`)
    
    if (readyPosts.length === 0) {
      console.log('No READY posts with assets to publish')
      return
    }
    
    // Publish in batches of 10
    const batchSize = 10
    let published = 0
    
    for (let i = 0; i < readyPosts.length; i += batchSize) {
      const batch = readyPosts.slice(i, i + batchSize)
      console.log(`Publishing batch ${Math.floor(i/batchSize) + 1}: ${batch.length} posts`)
      
      try {
        const response = await fetch('http://localhost:3002/api/auto-publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postIds: batch.map(p => p.id)
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Published ${result.data.publishedCount} posts`)
          published += result.data.publishedCount
        } else {
          console.log(`❌ Failed to publish batch`)
        }
      } catch (error) {
        console.log(`❌ Error publishing batch: ${error.message}`)
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    console.log(`\nPublishing complete: ${published} posts published`)
    
  } catch (error) {
    console.error('Error in publishAllReadyPosts:', error)
  }
}

async function main() {
  console.log('=== COMPREHENSIVE POST PROCESSING ===')
  
  // First process all READY posts to download media
  await processAllReadyPosts()
  
  // Then publish all READY posts with assets
  await publishAllReadyPosts()
  
  // Show final status
  const counts = await prisma.post.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  })
  
  console.log('\n=== FINAL STATUS ===')
  counts.forEach(c => {
    console.log(`${c.status}: ${c._count.id}`)
  })
  
  const readyWithAssets = await prisma.post.count({
    where: {
      status: 'READY',
      assets: {
        some: {}
      }
    }
  })
  
  console.log(`READY posts with assets: ${readyWithAssets}`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
