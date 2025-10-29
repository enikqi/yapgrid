const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function processPosts() {
  try {
    console.log('Processing READY posts to download media...')
    
    // Get first 5 READY posts
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY'
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${readyPosts.length} READY posts to process`)
    
    for (const post of readyPosts) {
      console.log(`\nProcessing: ${post.title}`)
      console.log(`URL: ${post.url}`)
      
      try {
        // Call the process API
        const response = await fetch('http://localhost:3002/api/posts/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: post.id
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Processed successfully: ${result.status}`)
        } else {
          const error = await response.text()
          console.log(`❌ Error: ${error}`)
        }
        
        // Wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.log(`❌ Error processing ${post.title}:`, error.message)
      }
    }
    
    console.log('\nProcessing completed!')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

processPosts()

