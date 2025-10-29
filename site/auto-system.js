const { PrismaClient } = require('@prisma/client')
const fetch = require('node-fetch')

const prisma = new PrismaClient()

async function processReadyPosts() {
  try {
    console.log('Processing READY posts to download media...')
    
    // Get READY posts without assets
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: {
          none: {}
        }
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (readyPosts.length === 0) {
      console.log('No READY posts without assets to process')
      return
    }
    
    console.log(`Found ${readyPosts.length} READY posts to process`)
    
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
          const result = await response.json()
          console.log(`✅ Media downloaded: ${post.title}`)
        } else {
          const errorText = await response.text()
          console.log(`❌ Failed to download media for: ${post.title}`)
        }
      } catch (error) {
        console.log(`❌ Error processing ${post.title}:`, error.message)
      }
    }
    
  } catch (error) {
    console.error('Error in processReadyPosts:', error)
  }
}

async function autoPublish() {
  try {
    console.log('Auto-publishing READY posts with assets...')
    
    // Get auto-posting settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['autoPublish', 'autoPublishIntervalMinutes', 'autoPublishBatchSize']
        }
      }
    })

    const config = {
      enabled: settings.find(s => s.key === 'autoPublish')?.value === 'true',
      intervalMinutes: parseInt(settings.find(s => s.key === 'autoPublishIntervalMinutes')?.value || '1'),
      batchSize: parseInt(settings.find(s => s.key === 'autoPublishBatchSize')?.value || '3')
    }

    if (!config.enabled) {
      console.log('Auto-publishing is disabled')
      return
    }

    // Get READY posts with assets
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: {
          some: {}
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: config.batchSize
    })

    if (readyPosts.length === 0) {
      console.log('No READY posts with assets to publish')
      return
    }

    console.log(`Found ${readyPosts.length} READY posts with assets to publish`)

    // Call the auto-publish API
    const response = await fetch('http://localhost:3002/api/auto-publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postIds: readyPosts.map(p => p.id)
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Published ${result.data.publishedCount} posts`)
    } else {
      const errorText = await response.text()
      console.error(`❌ Failed to publish posts: ${response.status} ${response.statusText}`)
    }

  } catch (error) {
    console.error('Error in autoPublish:', error)
  }
}

async function runSystem() {
  console.log('=== Auto-System Running ===')
  
  // First process READY posts to download media
  await processReadyPosts()
  
  // Then publish READY posts with assets
  await autoPublish()
  
  console.log('=== Auto-System Complete ===\n')
}

// Run the system every 30 seconds
console.log('Auto-System started - will run every 30 seconds')
runSystem() // Run immediately
setInterval(runSystem, 30 * 1000) // Then every 30 seconds
