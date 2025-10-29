const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixScheduledPosts() {
  try {
    console.log('🔧 FIXING SCHEDULED POSTS - Making them ready to publish NOW')
    
    // Get READY posts that are scheduled for future
    const futurePosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        scheduledPublishAt: {
          gt: new Date() // Posts scheduled for future
        }
      },
      select: { id: true, title: true, scheduledPublishAt: true }
    })
    
    console.log(`📊 Found ${futurePosts.length} posts scheduled for future`)
    
    if (futurePosts.length > 0) {
      console.log('🔄 Updating scheduled posts to be ready NOW...')
      
      // Update all future posts to be ready now
      const result = await prisma.post.updateMany({
        where: {
          status: 'READY',
          scheduledPublishAt: {
            gt: new Date()
          }
        },
        data: {
          scheduledPublishAt: new Date() // Ready to publish NOW
        }
      })
      
      console.log(`✅ Updated ${result.count} posts to be ready NOW`)
    }
    
    // Show current status
    const readyNow = await prisma.post.count({
      where: {
        status: 'READY',
        scheduledPublishAt: {
          lte: new Date() // Ready to publish now
        }
      }
    })
    
    const readyFuture = await prisma.post.count({
      where: {
        status: 'READY',
        scheduledPublishAt: {
          gt: new Date() // Scheduled for future
        }
      }
    })
    
    console.log(`\n📊 READY POSTS STATUS:`)
    console.log(`  🚀 Ready NOW: ${readyNow}`)
    console.log(`  ⏰ Scheduled for future: ${readyFuture}`)
    
    console.log(`\n🎉 SUCCESS! Now auto-publish will find ${readyNow} posts ready to publish!`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixScheduledPosts()
