const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestPublishedPost() {
  try {
    const post = await prisma.post.findFirst({
      where: { status: 'PUBLISHED' },
      include: { assets: true },
      orderBy: { publishedAt: 'desc' }
    });
    
    if (post) {
      console.log('Latest PUBLISHED post:', post.title);
      console.log('Published at:', post.publishedAt);
      console.log('Assets:', post.assets);
      console.log('Assets length:', post.assets.length);
      console.log('URL:', post.url);
      console.log('Preview:', post.preview);
    } else {
      console.log('No PUBLISHED posts found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestPublishedPost();
