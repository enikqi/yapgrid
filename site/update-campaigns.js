const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCampaigns() {
  try {
    console.log('Updating campaigns...');
    
    // Update existing campaign to use "new" posts
    const existingCampaign = await prisma.campaign.findFirst({
      where: { enabled: true }
    });
    
    if (existingCampaign) {
      await prisma.campaign.update({
        where: { id: existingCampaign.id },
        data: {
          name: 'Funny Memes (New Posts)',
          subreddits: ['funnymemes'],
          sortBy: 'new',
          timeRange: 'hour',
          postLimit: 10
        }
      });
      console.log('✅ Updated existing campaign to use NEW posts from funnymemes');
    }
    
    // Create new campaign for CringeTikToks
    await prisma.campaign.create({
      data: {
        name: 'Cringe TikTok Videos',
        subreddits: ['CringeTikToks'],
        sortBy: 'new',
        timeRange: 'hour',
        postLimit: 10,
        keywords: [],
        excludeKeywords: [],
        enabled: true
      }
    });
    console.log('✅ Created CringeTikToks campaign');
    
    // Show all campaigns
    const campaigns = await prisma.campaign.findMany();
    console.log('\nAll campaigns:');
    campaigns.forEach(c => {
      console.log(`- ${c.name}: r/${c.subreddits.join(', r/')} | Sort: ${c.sortBy} | Time: ${c.timeRange} | Enabled: ${c.enabled}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCampaigns();
