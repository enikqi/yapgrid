const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function autoFetchCron() {
  console.log('Auto-fetch cron job running...');
  try {
    // Get auto-processing configuration (needed for APP_PORT)
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'auto_processing_enabled',
            'auto_processing_delay_seconds',
            'auto_processing_batch_size'
          ]
        }
      }
    });

    const config = {
      enabled: false,
      delaySeconds: 10,
      batchSize: 1,
      APP_PORT: process.env.APP_PORT || '3002' // Get APP_PORT from env
    };

    settings.forEach(setting => {
      switch (setting.key) {
        case 'auto_processing_enabled':
          config.enabled = setting.value;
          break;
        case 'auto_processing_delay_seconds':
          config.delaySeconds = setting.value;
          break;
        case 'auto_processing_batch_size':
          config.batchSize = setting.value;
          break;
      }
    });

    // Find enabled campaigns to run
    const campaigns = await prisma.campaign.findMany({
      where: {
        enabled: true // Corrected from isActive to enabled
      }
    });

    console.log(`Found ${campaigns.length} active campaigns`);

    if (campaigns.length === 0) {
      console.log('No active campaigns found');
      return;
    }

    // Clear Reddit cache before fetching new posts
    console.log('Clearing Reddit cache...');
    try {
      const clearCacheResponse = await fetch(`http://localhost:${config.APP_PORT}/api/reddit/clear-cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (clearCacheResponse.ok) {
        console.log('✅ Reddit cache cleared');
      }
    } catch (error) {
      console.log('⚠️ Could not clear cache (API might not exist)');
    }

    for (const campaign of campaigns) {
      console.log(`Running campaign: ${campaign.name}`);
      const response = await fetch(`http://localhost:${config.APP_PORT}/api/campaigns/${campaign.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Campaign run successful: ${campaign.name}`);
        console.log(`📊 Fetched: ${result.data.postsFetched}, Saved: ${result.data.postsSaved}`);
      } else {
        console.error(`Failed to run campaign ${campaign.name}:`, result.error);
      }
    }
    console.log(`Auto-fetch completed for ${campaigns.length} campaigns`);
  } catch (error) {
    console.error('Error in auto-fetch cron:', error);
  } finally {
    await prisma.$disconnect();
  }
}

autoFetchCron();
