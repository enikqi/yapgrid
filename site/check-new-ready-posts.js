const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNewAndReadyPosts() {
  try {
    const newPosts = await prisma.post.findMany({
      where: { status: 'NEW' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('NEW posts:', newPosts.length);
    newPosts.forEach((p, i) => {
      console.log(`${i+1}. ${p.title.substring(0, 50)}... - ${p.createdAt.toISOString()}`);
    });
    
    const readyPosts = await prisma.post.findMany({
      where: { status: 'READY' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\nREADY posts:', readyPosts.length);
    readyPosts.forEach((p, i) => {
      console.log(`${i+1}. ${p.title.substring(0, 50)}... - ${p.createdAt.toISOString()}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewAndReadyPosts();
