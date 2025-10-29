const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAllPosts() {
  try {
    console.log('=== CHECKING ALL POSTS ===\n')

    // Get all posts
    const allPosts = await prisma.post.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Total posts found: ${allPosts.length}`)
    allPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`)
      console.log(`   Status: ${post.status}`)
      console.log(`   Subreddit: ${post.subreddit}`)
      console.log(`   Created: ${post.createdAt}`)
      console.log()
    })

    // Get status counts
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    console.log('Status counts:')
    counts.forEach(count => {
      console.log(`  ${count.status}: ${count._count.id}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllPosts()