const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProcessedPosts() {
  try {
    console.log('=== CHECKING PROCESSED POSTS ===')
    
    // Get posts that were recently processed
    const processedPosts = await prisma.post.findMany({
      where: { 
        status: 'READY',
        processedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      take: 5,
      include: { assets: true }
    })
    
    console.log(`Found ${processedPosts.length} recently processed READY posts:`)
    processedPosts.forEach(post => {
      console.log(`- ${post.title}`)
      console.log(`  URL: ${post.url}`)
      console.log(`  Assets: ${post.assets.length}`)
      if (post.assets.length > 0) {
        post.assets.forEach(asset => {
          console.log(`    - ${asset.type}: ${asset.pathOrKey}`)
        })
      }
      console.log('')
    })
    
    // Check if there are any posts with errors
    const errorPosts = await prisma.post.findMany({
      where: { 
        error: { not: null },
        processedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      },
      take: 3
    })
    
    console.log(`Posts with errors (${errorPosts.length}):`)
    errorPosts.forEach(post => {
      console.log(`- ${post.title}`)
      console.log(`  Error: ${post.error}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProcessedPosts()
