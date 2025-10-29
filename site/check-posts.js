const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPosts() {
  try {
    const total = await prisma.post.count()
    const withAssets = await prisma.post.count({ 
      where: { 
        assets: { 
          some: {} 
        } 
      } 
    })
    const withoutAssets = await prisma.post.count({ 
      where: { 
        assets: { 
          none: {} 
        } 
      } 
    })
    
    console.log('📊 Database Status:')
    console.log('  Total posts:', total)
    console.log('  Posts with assets:', withAssets)
    console.log('  Posts without assets:', withoutAssets)
    
    // Show some examples
    const examples = await prisma.post.findMany({
      where: {
        assets: {
          some: {}
        }
      },
      take: 3,
      select: {
        id: true,
        title: true,
        assets: {
          select: {
            type: true
          }
        }
      }
    })
    
    console.log('\n📎 Example posts with assets:')
    examples.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title.substring(0, 50)}... (${post.assets.length} assets)`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPosts()
