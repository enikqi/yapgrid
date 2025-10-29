const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAutoProcessing() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'auto_processing'
        }
      }
    })
    
    console.log('Auto-processing settings:')
    settings.forEach(s => {
      console.log(`${s.key}: ${s.value}`)
    })
    
    // Check NEW posts count
    const newPostsCount = await prisma.post.count({
      where: { status: 'NEW' }
    })
    
    console.log(`\nNEW posts count: ${newPostsCount}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAutoProcessing()

