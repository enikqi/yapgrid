const { PrismaClient } = require('@prisma/client')

async function checkPostThumbnail() {
  const prisma = new PrismaClient()
  
  try {
    const post = await prisma.post.findUnique({
      where: { id: 'cmgxoulzm0cffvjqoj9xflbq9' },
      include: { 
        assets: {
          where: {
            type: 'THUMBNAIL'
          }
        } 
      }
    })
    
    console.log('Post Thumbnail:', JSON.stringify(post, null, 2))
    
    if (post && post.assets.length > 0) {
      const fs = require('fs')
      const path = require('path')
      
      console.log('\nThumbnail Assets:')
      for (const asset of post.assets) {
        const fullPath = path.join(process.cwd(), 'public', asset.pathOrKey)
        const exists = fs.existsSync(fullPath)
        console.log(`- ${asset.pathOrKey}: ${exists ? 'Exists' : 'Missing'}`)
        console.log(`  - Full path: ${fullPath}`)
      }
    } else {
      console.log('No thumbnail assets found for this post')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPostThumbnail()
