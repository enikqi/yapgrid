const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDirect() {
  try {
    // Get a NEW image post
    const imagePost = await prisma.post.findFirst({
      where: { 
        status: 'NEW',
        url: { contains: 'i.redd.it' }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('=== TESTING IMAGE POST ===')
    console.log('Title:', imagePost.title)
    console.log('URL:', imagePost.url)
    console.log()

    // Test downloading directly
    console.log('Calling /api/media/download...')
    const response = await fetch('http://localhost:3002/api/media/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        postId: imagePost.id,
        url: imagePost.url
      })
    })

    const result = await response.json()
    console.log('Download result:', JSON.stringify(result, null, 2))

    // Check assets
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const assets = await prisma.asset.findMany({
      where: { postId: imagePost.id }
    })

    console.log()
    console.log('Assets created:', assets.length)
    if (assets.length > 0) {
      assets.forEach(asset => {
        console.log(`  - ${asset.type}: ${asset.pathOrKey}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDirect()

