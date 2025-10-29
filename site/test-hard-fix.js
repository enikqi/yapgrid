const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testHardFix() {
  try {
    console.log('=== TESTING HARD FIX ===')
    
    // Get READY posts with assets
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: {
          some: {}
        }
      },
      take: 3,
      include: {
        assets: true
      }
    })

    console.log(`Found ${readyPosts.length} READY posts with assets:`)
    readyPosts.forEach(post => {
      console.log(`- ${post.title} (${post.assets.length} assets)`)
    })

    if (readyPosts.length > 0) {
      // Directly update posts to PUBLISHED status
      const postIds = readyPosts.map(p => p.id)
      
      const result = await prisma.post.updateMany({
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

      console.log(`✅ HARD FIX: Published ${result.count} posts directly to database`)
    } else {
      console.log('No READY posts with assets found')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testHardFix()
