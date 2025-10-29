const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['autoPublish', 'autoPublishIntervalMinutes', 'autoPublishBatchSize']
        }
      }
    })
    
    console.log('Auto-posting settings in database:')
    settings.forEach(s => {
      console.log(`${s.key}: ${s.value}`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSettings()

