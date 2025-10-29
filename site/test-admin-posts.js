const { PrismaClient } = require('@prisma/client')

async function testAdminPosts() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing admin posts API...')
    
    // Test database connection
    const postCount = await prisma.post.count()
    console.log(`Total posts in database: ${postCount}`)
    
    // Test fetching posts
    const posts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        assets: {
          select: {
            id: true,
            type: true,
            url: true
          }
        }
      }
    })
    
    console.log(`Fetched ${posts.length} posts`)
    console.log('Sample post:', posts[0] ? {
      id: posts[0].id,
      title: posts[0].title,
      author: posts[0].author,
      subreddit: posts[0].subreddit,
      status: posts[0].status,
      assetsCount: posts[0].assets.length
    } : 'No posts found')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminPosts()
