const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkReadyPost() {
  try {
    const readyPost = await prisma.post.findFirst({
      where: { status: 'READY' },
      include: { assets: true }
    })

    if (!readyPost) {
      console.log('No READY posts found')
      return
    }

    console.log('=== READY POST ===')
    console.log('Title:', readyPost.title)
    console.log('URL:', readyPost.url)
    console.log('Status:', readyPost.status)
    console.log('Assets:', readyPost.assets.length)
    console.log('Error:', readyPost.error)
    
    if (readyPost.assets.length > 0) {
      readyPost.assets.forEach((asset, index) => {
        console.log(`Asset ${index + 1}:`, {
          type: asset.type,
          storage: asset.storage,
          pathOrKey: asset.pathOrKey,
          url: asset.url
        })
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkReadyPost()