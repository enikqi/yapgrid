const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function autoProcessingCron() {
  try {
    console.log('Auto-processing cron job running...');
    
    // Get auto-processing configuration
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
      batchSize: 1
    };

    settings.forEach(setting => {
      switch (setting.key) {
        case 'auto_processing_enabled':
          config.enabled = setting.value === 'true';
          break;
        case 'auto_processing_delay_seconds':
          config.delaySeconds = parseInt(setting.value);
          break;
        case 'auto_processing_batch_size':
          config.batchSize = parseInt(setting.value);
          break;
      }
    });

    if (!config.enabled) {
      console.log('Auto-processing is disabled');
      return;
    }

    // Find NEW posts to process
    const postsToProcess = await prisma.post.findMany({
      where: {
        status: 'NEW'
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: config.batchSize
    });

    if (postsToProcess.length === 0) {
      console.log('No NEW posts to process');
      return;
    }

    // Process each post with delay
    for (const post of postsToProcess) {
      try {
        console.log(`Processing post: ${post.title}`);
        
        // Call the process posts API endpoint
        const response = await fetch(`http://localhost:3002/api/posts/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Processed: ${post.title}`);
        } else {
          console.log(`❌ Failed to process: ${post.title} - ${result.error}`);
        }

        // Add delay between posts (except for the last one)
        if (post !== postsToProcess[postsToProcess.length - 1]) {
          console.log(`Waiting ${config.delaySeconds} seconds before next post...`);
          await new Promise(resolve => setTimeout(resolve, config.delaySeconds * 1000));
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
      }
    }

    console.log(`Auto-processed ${postsToProcess.length} posts`);

  } catch (error) {
    console.error('Error in auto-processing cron:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cron job
autoProcessingCron();
