const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAutoFetchingManual() {
  try {
    // Get active campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        enabled: true
      }
    });

    console.log(`Active campaigns: ${campaigns.length}`);
    
    if (campaigns.length === 0) {
      console.log('No active campaigns');
      return;
    }

    // Test fetching from first campaign
    const campaign = campaigns[0];
    console.log(`Testing campaign: ${campaign.name} - Subreddits: ${JSON.stringify(campaign.subreddits)}`);

    // Make API call to test fetching
    const response = await fetch('http://localhost:3002/api/campaigns/' + campaign.id + '/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('Test fetch result:', result);

    // Check if new posts were created
    const newPosts = await prisma.post.count({
      where: {
        status: 'NEW'
      }
    });
    console.log(`NEW posts after test: ${newPosts}`);

    // Check recent posts
    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      take: 3,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Recent posts (last 5 minutes): ${recentPosts.length}`);
    recentPosts.forEach((post, i) => {
      console.log(`${i+1}. ${post.title} - Status: ${post.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoFetchingManual();
