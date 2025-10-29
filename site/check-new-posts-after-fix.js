const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNewPostsAfterFix() {
  try {
    // Check if there are any NEW posts
    const newPosts = await prisma.post.count({
      where: {
        status: 'NEW'
      }
    });

    console.log(`NEW posts: ${newPosts}`);

    // Check recent posts
    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Recent posts (last 10 minutes): ${recentPosts.length}`);
    recentPosts.forEach((post, i) => {
      console.log(`${i+1}. ${post.title} - Status: ${post.status} - Created: ${post.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewPostsAfterFix();
