const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function autoPublishCron() {
  try {
    console.log('Auto-publish cron job running...');
    
    // Get auto-posting configuration
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'auto_posting_enabled',
            'auto_posting_interval_minutes',
            'auto_posting_batch_size'
          ]
        }
      }
    });

    const config = {
      enabled: false,
      intervalMinutes: 30,
      batchSize: 1
    };

    settings.forEach(setting => {
      switch (setting.key) {
        case 'auto_posting_enabled':
          config.enabled = setting.value;
          break;
        case 'auto_posting_interval_minutes':
          config.intervalMinutes = setting.value;
          break;
        case 'auto_posting_batch_size':
          config.batchSize = setting.value;
          break;
      }
    });

    if (!config.enabled) {
      console.log('Auto-posting is disabled');
      return;
    }

    // Find READY posts with assets to publish
    const postsWithAssets = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: {
          some: {}
        }
      },
      include: {
        assets: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: config.batchSize
    });

    if (postsWithAssets.length === 0) {
      console.log('No READY posts with assets to publish');
      return;
    }

    // Publish posts
    for (const post of postsWithAssets) {
      console.log(`Auto-publishing: ${post.title}`);
      
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });
      
      console.log(`✅ Auto-published: ${post.title}`);
    }

    console.log(`Auto-published ${postsWithAssets.length} posts`);

  } catch (error) {
    console.error('Error in auto-publish cron:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cron job
autoPublishCron();
