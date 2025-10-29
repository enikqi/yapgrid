const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupAutoPublishing() {
  try {
    console.log('Setting up auto-publishing configuration...')
    
    // Set auto-publishing settings
    await prisma.setting.upsert({
      where: { key: 'autoPublish' },
      update: { value: 'true' },
      create: { key: 'autoPublish', value: 'true' }
    })
    
    await prisma.setting.upsert({
      where: { key: 'autoPublishIntervalMinutes' },
      update: { value: '1' },
      create: { key: 'autoPublishIntervalMinutes', value: '1' }
    })
    
    await prisma.setting.upsert({
      where: { key: 'autoPublishBatchSize' },
      update: { value: '3' },
      create: { key: 'autoPublishBatchSize', value: '3' }
    })
    
    console.log('Auto-publishing configuration saved:')
    console.log('- Enabled: true')
    console.log('- Interval: 1 minute')
    console.log('- Batch size: 3 posts')
    
  } catch (error) {
    console.error('Error setting up auto-publishing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAutoPublishing()

