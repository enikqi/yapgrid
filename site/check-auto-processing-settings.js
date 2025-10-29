const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAutoProcessingSettings() {
  try {
    console.log('=== AUTO-PROCESSING SETTINGS ===\n')

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['auto_processing_enabled', 'auto_processing_delay_seconds', 'auto_processing_batch_size']
        }
      }
    })

    console.log('Auto-processing settings:')
    settings.forEach(setting => {
      console.log(`  ${setting.key}: ${setting.value}`)
    })

    // Check NEW posts
    const newPosts = await prisma.post.findMany({
      where: { status: 'NEW' },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`\nNEW posts: ${newPosts.length}`)
    newPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`)
      console.log(`   Status: ${post.status}`)
      console.log(`   Created: ${post.createdAt}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAutoProcessingSettings()

