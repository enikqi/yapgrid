const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugNewPosts() {
  try {
    console.log('=== DEBUGGING NEW POSTS ===\n')

    // Get NEW posts
    const newPosts = await prisma.post.findMany({
      where: { status: 'NEW' },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`NEW posts: ${newPosts.length}`)
    newPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`)
      console.log(`   URL: ${post.url}`)
      console.log(`   Subreddit: ${post.subreddit}`)
      console.log()
    })

    if (newPosts.length > 0) {
      const testPost = newPosts[0]
      console.log(`Testing processing for: ${testPost.title}`)
      
      try {
        const response = await fetch('http://localhost:3002/api/posts/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: testPost.id })
        })

        const result = await response.json()
        console.log('Processing result:', result)

        // Check assets after processing
        const assets = await prisma.asset.findMany({
          where: { postId: testPost.id }
        })
        console.log(`Assets after processing: ${assets.length}`)

        // Check post status after processing
        const updatedPost = await prisma.post.findUnique({
          where: { id: testPost.id }
        })
        console.log(`Post status after processing: ${updatedPost.status}`)

      } catch (error) {
        console.error('Error during processing:', error)
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugNewPosts()

