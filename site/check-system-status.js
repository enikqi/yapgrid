const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSystemStatus() {
  try {
    console.log('🔍 CHECKING SYSTEM STATUS...\n');
    
    // Check post counts
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('📊 POST STATUS COUNTS:');
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`);
    });
    
    // Check campaigns
    const campaignCount = await prisma.campaign.count({
      where: { enabled: true }
    });
    
    console.log(`\n🎯 ACTIVE CAMPAIGNS: ${campaignCount}`);
    
    // Check recent posts
    const recentPosts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { title: true, publishedAt: true, subreddit: true }
    });
    
    console.log('\n📰 RECENT PUBLISHED POSTS:');
    recentPosts.forEach((post, index) => {
      const timeAgo = post.publishedAt ? 
        Math.round((Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60)) + ' minutes ago' : 
        'Unknown';
      console.log(`  ${index + 1}. ${post.title.substring(0, 50)}... (${post.subreddit}) - ${timeAgo}`);
    });
    
    // Check if there are NEW posts to process
    const newPostsCount = await prisma.post.count({
      where: { status: 'NEW' }
    });
    
    console.log(`\n🔄 NEW POSTS TO PROCESS: ${newPostsCount}`);
    
    if (newPostsCount > 0) {
      console.log('✅ There are NEW posts available for processing!');
    } else {
      console.log('⚠️ No NEW posts found - system may need to fetch more posts');
    }
    
    console.log('\n🎉 SYSTEM STATUS CHECK COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemStatus();
