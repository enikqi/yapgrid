const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function hardFixAutoPublish() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] === HARD FIX AUTO-PUBLISH ===`)
    
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

    // Directly update posts to PUBLISHED status (bypass all APIs and queues)
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
    
    // Get current stats
    const stats = await prisma.post.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })
    
    console.log('Current status:')
    stats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.id}`)
    })

  } catch (error) {
    console.error('Error in hard fix auto-publish:', error)
  }
}

// Run immediately
hardFixAutoPublish()

// Run every minute
console.log('Hard fix auto-publish script started - will run every minute')
setInterval(hardFixAutoPublish, 60 * 1000)
