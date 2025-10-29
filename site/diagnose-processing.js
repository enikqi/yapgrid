const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function diagnose() {
  try {
    // Get a NEW post
    const newPost = await prisma.post.findFirst({
      where: { status: 'NEW' },
      orderBy: { createdAt: 'desc' }
    })

    if (!newPost) {
      console.log('No NEW posts found')
      return
    }

    console.log('=== POST TO DIAGNOSE ===')
    console.log('Title:', newPost.title)
    console.log('URL:', newPost.url)
    console.log('Subreddit:', newPost.subreddit)
    console.log('Status:', newPost.status)
    console.log()

    // Try to process it
    console.log('Attempting to process...')
    const response = await fetch('http://localhost:3002/api/posts/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: newPost.id, batchSize: 1 })
    })

    const result = await response.json()
    console.log('Process result:', JSON.stringify(result, null, 2))

    // Wait 2 seconds for processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check post status after processing
    const updatedPost = await prisma.post.findUnique({
      where: { id: newPost.id },
      include: { assets: true }
    })

    console.log()
    console.log('=== AFTER PROCESSING ===')
    console.log('Status:', updatedPost.status)
    console.log('Assets:', updatedPost.assets.length)
    console.log('Error:', updatedPost.error)
    
    if (updatedPost.assets.length > 0) {
      console.log('Asset types:', updatedPost.assets.map(a => a.type).join(', '))
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()


