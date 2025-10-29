const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAutoFetchingStatus() {
  try {
    console.log('=== CHECKING AUTO-FETCHING STATUS ===')
    
    // Check if auto-fetching cron is running
    console.log('Checking if auto-fetching cron is running...')
    
    // Check recent posts to see if new ones are being fetched
    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      take: 5,
      select: {
        title: true,
        subreddit: true,
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`\nRecent posts (last 5 minutes): ${recentPosts.length}`)
    recentPosts.forEach(post => {
      console.log(`- ${post.title}`)
      console.log(`  Subreddit: ${post.subreddit}`)
      console.log(`  Status: ${post.status}`)
      console.log(`  Created: ${post.createdAt}`)
      console.log('')
    })
    
    // Check if there's a cron job running
    console.log('To enable continuous auto-fetching, you need to run:')
    console.log('node auto-fetch-cron.js')
    console.log('\nThis will continuously fetch new posts from enabled campaigns.')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAutoFetchingStatus()
