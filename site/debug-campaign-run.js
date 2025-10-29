const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCampaignRun() {
  try {
    // Get campaign details
    const campaign = await prisma.campaign.findFirst({
      where: {
        name: {
          contains: 'Funny Memes'
        }
      }
    });

    if (!campaign) {
      console.log('Campaign not found');
      return;
    }

    console.log('Campaign details:');
    console.log(`Name: ${campaign.name}`);
    console.log(`Subreddits: ${JSON.stringify(campaign.subreddits)}`);
    console.log(`Keywords: ${JSON.stringify(campaign.keywords)}`);
    console.log(`ExcludeKeywords: ${JSON.stringify(campaign.excludeKeywords)}`);
    console.log(`MinScore: ${campaign.minScore}`);
    console.log(`MaxScore: ${campaign.maxScore}`);
    console.log(`SortBy: ${campaign.sortBy}`);
    console.log(`TimeRange: ${campaign.timeRange}`);
    console.log(`IncludeNsfw: ${campaign.includeNsfw}`);
    console.log(`PostLimit: ${campaign.postLimit}`);
    console.log(`Enabled: ${campaign.enabled}`);

    // Test the campaign run API directly
    console.log('\nTesting campaign run API...');
    const response = await fetch('http://localhost:3002/api/campaigns/' + campaign.id + '/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCampaignRun();
