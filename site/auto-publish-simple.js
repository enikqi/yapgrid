const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function autoPublish() {
  try {
    console.log('Starting auto-publish...')
    
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
    
    console.log(`Found ${readyPosts.length} READY posts with assets`)
    
    if (readyPosts.length === 0) {
      console.log('No READY posts with assets to publish')
      return
    }
    
    // Publish posts
    for (const post of readyPosts) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      })
      console.log(`Published post: ${post.title}`)
    }
    
    console.log(`Successfully published ${readyPosts.length} posts`)
    
  } catch (error) {
    console.error('Auto-publish error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run immediately
autoPublish()

// Set up interval
setInterval(autoPublish, 60000) // Run every minute

console.log('Auto-publish script started - will run every minute')


