const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deletePostsWithoutAssets() {
  try {
    console.log('🔍 Checking for posts without assets...')
    
    // Find posts that have no assets
    const postsWithoutAssets = await prisma.post.findMany({
      where: {
        assets: {
          none: {}
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        assets: true
      }
    })

    console.log(`📊 Found ${postsWithoutAssets.length} posts without assets`)

    if (postsWithoutAssets.length === 0) {
      console.log('✅ No posts to delete!')
      return
    }

    // Show first 5 examples
    console.log('\n📋 Examples of posts without assets:')
    console.log('=====================================')
    postsWithoutAssets.slice(0, 5).forEach((post, index) => {
      console.log(`${index + 1}. [${post.status}] ${post.title.substring(0, 50)}...`)
    })
    if (postsWithoutAssets.length > 5) {
      console.log(`... and ${postsWithoutAssets.length - 5} more`)
    }

    console.log(`\n🗑️  Deleting ${postsWithoutAssets.length} posts without assets...`)

    // Delete posts without assets
    const deleteResult = await prisma.post.deleteMany({
      where: {
        assets: {
          none: {}
        }
      }
    })

    console.log(`✅ Successfully deleted ${deleteResult.count} posts without assets!`)

    // Show remaining posts count
    const remainingCount = await prisma.post.count()
    const postsWithAssets = await prisma.post.findMany({
      where: {
        assets: {
          some: {}
        }
      },
      select: {
        id: true
      }
    })

    console.log(`\n📊 Remaining: ${remainingCount} total posts`)
    console.log(`📊 Posts with assets: ${postsWithAssets.length}`)
    console.log(`📊 Posts without assets: ${remainingCount - postsWithAssets.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deletePostsWithoutAssets()
