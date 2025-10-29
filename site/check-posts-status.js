const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { assets: true }
    });
    
    console.log('Recent posts:');
    posts.forEach((p, i) => {
      console.log(`${i+1}. ${p.title.substring(0, 50)}... - Status: ${p.status} - Assets: ${p.assets.length}`);
    });
    
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('\nStatus counts:');
    counts.forEach(c => {
      console.log(`${c.status}: ${c._count.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPosts();
