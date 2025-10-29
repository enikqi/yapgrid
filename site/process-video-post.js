const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function processVideoPost() {
  try {
    // Get a video post
    const videoPost = await prisma.post.findFirst({
      where: {
        status: 'READY',
        url: {
          contains: 'v.redd.it'
        }
      }
    })
    
    if (!videoPost) {
      console.log('No video posts found')
      return
    }
    
    console.log(`Processing video post: ${videoPost.title}`)
    console.log(`URL: ${videoPost.url}`)
    
    // Call the process API
    const response = await fetch('http://localhost:3002/api/posts/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: videoPost.id
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Processed successfully:`, result)
      
      // Check if assets were created
      const updatedPost = await prisma.post.findUnique({
        where: { id: videoPost.id },
        include: { assets: true }
      })
      
      console.log(`Assets created: ${updatedPost.assets.length}`)
      updatedPost.assets.forEach(asset => {
        console.log(`  - ${asset.type}: ${asset.pathOrKey}`)
      })
      
    } else {
      const error = await response.text()
      console.log(`❌ Error: ${error}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

processVideoPost()

