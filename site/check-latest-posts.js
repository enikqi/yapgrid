const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkLatestPosts() {
  try {
    // Check latest posts regardless of status
    const latestPosts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    })
    
    console.log('Latest 5 posts:')
    latestPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title} (${post.status}) - ${post.createdAt}`)
    })
    
    // Check if there are any NEW posts
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

checkLatestPosts()

