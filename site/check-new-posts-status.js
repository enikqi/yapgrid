const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkNewPosts() {
  try {
    const newPosts = await prisma.post.findMany({
      where: { status: 'NEW' },
      take: 5
    })
    
    console.log(`NEW posts: ${newPosts.length}`)
    newPosts.forEach(p => {
      console.log(`- ${p.title}`)
    })
    
    // Check all status counts
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })
    
    console.log('\nAll status counts:')
    counts.forEach(c => {
      console.log(`${c.status}: ${c._count.id}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkNewPosts()

