const { PrismaClient } = require('@prisma/client')
const fetch = require('node-fetch')

const prisma = new PrismaClient()

async function hardFixAutoPublish() {
  try {
    console.log('=== HARD FIX AUTO-PUBLISH ===')
    
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

    console.log('Auto-publish config:', config)

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
      take: config.batchSize,
      include: {
        assets: true
      }
    })

    if (readyPosts.length === 0) {
      console.log('No READY posts with assets to publish')
      return
    }

    console.log(`Found ${readyPosts.length} READY posts with assets to publish:`)
    readyPosts.forEach(post => {
      console.log(`- ${post.title} (${post.assets.length} assets)`)
    })

    // Directly update posts to PUBLISHED status (bypass API)
    const postIds = readyPosts.map(p => p.id)
    
    const updateResult = await prisma.post.updateMany({
      where: {
        id: {
          in: postIds
        }
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    })

    console.log(`✅ HARD FIX: Published ${updateResult.count} posts directly to database`)
    
    // Verify the update
    const publishedPosts = await prisma.post.findMany({
      where: {
        id: {
          in: postIds
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true
      }
    })

    console.log('Verification - Published posts:')
    publishedPosts.forEach(post => {
      console.log(`- ${post.title}: ${post.status} (${post.publishedAt})`)
    })

  } catch (error) {
    console.error('Error in hard fix auto-publish:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run immediately
hardFixAutoPublish()

// Also run every minute
console.log('Hard fix auto-publish script started - will run every minute')
setInterval(hardFixAutoPublish, 60 * 1000)
