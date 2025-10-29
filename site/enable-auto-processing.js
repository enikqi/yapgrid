const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function enableAutoProcessing() {
  try {
    console.log('=== ENABLING AUTO-PROCESSING ===')
    
    // Enable auto-processing
    await prisma.setting.upsert({
      where: { key: 'auto_processing_enabled' },
      update: { value: 'true' },
      create: { key: 'auto_processing_enabled', value: 'true' }
    })
    
    await prisma.setting.upsert({
      where: { key: 'auto_processing_delay_seconds' },
      update: { value: '10' },
      create: { key: 'auto_processing_delay_seconds', value: '10' }
    })
    
    await prisma.setting.upsert({
      where: { key: 'auto_processing_batch_size' },
      update: { value: '3' },
      create: { key: 'auto_processing_batch_size', value: '3' }
    })
    
    console.log('✅ Auto-processing enabled!')
    console.log('- Enabled: true')
    console.log('- Delay: 10 seconds')
    console.log('- Batch size: 3 posts')
    
    // Also enable auto-fetching
    await prisma.setting.upsert({
      where: { key: 'auto_fetching_enabled' },
      update: { value: 'true' },
      create: { key: 'auto_fetching_enabled', value: 'true' }
    })
    
    await prisma.setting.upsert({
      where: { key: 'auto_fetching_interval_seconds' },
      update: { value: '30' },
      create: { key: 'auto_fetching_interval_seconds', value: '30' }
    })
    
    await prisma.setting.upsert({
      where: { key: 'auto_fetching_batch_size' },
      update: { value: '5' },
      create: { key: 'auto_fetching_batch_size', value: '5' }
    })
    
    console.log('\n✅ Auto-fetching also enabled!')
    console.log('- Enabled: true')
    console.log('- Interval: 30 seconds')
    console.log('- Batch size: 5 posts')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enableAutoProcessing()
