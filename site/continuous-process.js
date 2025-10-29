const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function processAndPublish() {
  try {
    console.log('=== PROCESSING AND PUBLISHING ===')
    
    // Get READY posts without assets
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: {
          none: {}
        }
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${readyPosts.length} READY posts without assets`)
    
    // Process each post
    for (const post of readyPosts) {
      console.log(`Processing: ${post.title}`)
      
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
          console.log(`✅ Success: ${post.title}`)
        } else {
          console.log(`❌ Failed: ${post.title}`)
        }
      } catch (error) {
        console.log(`❌ Error: ${post.title}`)
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Now publish READY posts with assets
    const readyWithAssets = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: {
          some: {}
        }
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\nFound ${readyWithAssets.length} READY posts with assets`)
    
    if (readyWithAssets.length > 0) {
      try {
        const response = await fetch('http://localhost:3002/api/auto-publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postIds: readyWithAssets.map(p => p.id)
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Published ${result.data.publishedCount} posts`)
        } else {
          console.log(`❌ Failed to publish posts`)
        }
      } catch (error) {
        console.log(`❌ Error publishing: ${error.message}`)
      }
    }
    
    // Show final status
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })
    
    console.log('\n=== STATUS ===')
    counts.forEach(c => {
      console.log(`${c.status}: ${c._count.id}`)
    })
    
    const readyWithAssetsCount = await prisma.post.count({
      where: {
        status: 'READY',
        assets: {
          some: {}
        }
      }
    })
    
    console.log(`READY posts with assets: ${readyWithAssetsCount}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run every 2 minutes
console.log('Starting continuous processing - runs every 2 minutes')
processAndPublish() // Run immediately
setInterval(processAndPublish, 2 * 60 * 1000) // Then every 2 minutes
