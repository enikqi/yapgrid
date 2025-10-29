const { PrismaClient } = require('@prisma/client')

async function checkPost() {
  const prisma = new PrismaClient()
  
  try {
    const post = await prisma.post.findUnique({
      where: { id: 'cmgxoulzm0cffvjqoj9xflbq9' },
      include: { assets: true }
    })
    
    console.log('Post:', JSON.stringify(post, null, 2))
    
    if (post) {
      console.log('\nAssets:')
      for (const asset of post.assets) {
        console.log(`- ${asset.type}: ${asset.pathOrKey} (${asset.mimeType})`)
        
        // For local files, check if they exist
        if (asset.storage === 'LOCAL' && asset.pathOrKey) {
          const fs = require('fs')
          const path = require('path')
          const fullPath = path.join(process.cwd(), 'public', asset.pathOrKey)
          const exists = fs.existsSync(fullPath)
          console.log(`  - Local file exists: ${exists}`)
          console.log(`  - Full path: ${fullPath}`)
        }
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPost()
