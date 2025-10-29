const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentFailures() {
  try {
    // Get the most recent failed posts to see what went wrong
    const recentFailed = await prisma.post.findMany({
      where: { status: 'FAILED' },
      select: {
        id: true,
        title: true,
        subreddit: true,
        error: true,
        createdAt: true,
        url: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('🔍 RECENT FAILED POSTS:');
    console.log('======================');
    recentFailed.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title.substring(0, 50)}...`);
      console.log(`   Subreddit: r/${post.subreddit}`);
      console.log(`   URL: ${post.url}`);
      console.log(`   Error: ${post.error || 'No error message'}`);
      console.log(`   Created: ${post.createdAt}`);
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecentFailures();
