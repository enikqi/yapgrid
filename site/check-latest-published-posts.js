const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestPublishedPosts() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      include: { assets: true },
      orderBy: { publishedAt: 'desc' },
      take: 5
    });
    
    console.log('Latest PUBLISHED posts:');
    posts.forEach((post, i) => {
      console.log(`${i+1}. ${post.title} - ${post.publishedAt} - Assets: ${post.assets.length}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestPublishedPosts();
