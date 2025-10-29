const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCampaigns() {
  try {
    console.log('🔍 Checking all campaigns...');
    
    const allCampaigns = await prisma.campaign.findMany({
      select: { id: true, name: true, enabled: true, subreddits: true }
    });
    
    const enabledCampaigns = allCampaigns.filter(c => c.enabled);
    const disabledCampaigns = allCampaigns.filter(c => !c.enabled);
    
    console.log(`📊 Total campaigns: ${allCampaigns.length}`);
    console.log(`✅ Enabled campaigns: ${enabledCampaigns.length}`);
    console.log(`❌ Disabled campaigns: ${disabledCampaigns.length}`);
    
    console.log('\n✅ Enabled campaigns:');
    enabledCampaigns.forEach(campaign => {
      let subredditCount = 0;
      try {
        if (typeof campaign.subreddits === 'string') {
          const parsed = JSON.parse(campaign.subreddits);
          subredditCount = Array.isArray(parsed) ? parsed.length : 0;
        }
      } catch {
        subredditCount = 0;
      }
      console.log(`  - ${campaign.name} (${subredditCount} subreddits)`);
    });
    
    if (disabledCampaigns.length > 0) {
      console.log('\n❌ Disabled campaigns:');
      disabledCampaigns.forEach(campaign => {
        console.log(`  - ${campaign.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaigns();
