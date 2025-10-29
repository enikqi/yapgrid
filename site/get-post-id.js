const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getNewPostId() {
  try {
    const newPost = await prisma.post.findFirst({
      where: { status: 'NEW' },
      orderBy: { createdAt: 'desc' }
    })

    if (!newPost) {
      console.log('No NEW posts found')
      return
    }

    console.log('Post ID:', newPost.id)
    console.log('Title:', newPost.title)
    console.log('URL:', newPost.url)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getNewPostId()
