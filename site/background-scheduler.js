const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🚀 Starting background job scheduler...');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';

// Auto-processing cron job (runs every 2 minutes to process NEW posts)
// Reduced from 30 seconds to prevent CPU spikes and missed executions
let isProcessing = false;
const MAX_CONCURRENT_POSTS = 5;
const PROCESSING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

cron.schedule('*/2 * * * *', async () => {
  // Prevent concurrent executions
  if (isProcessing) {
    console.log('⏭️  Auto-processing already running, skipping...');
    return;
  }

  isProcessing = true;
  const startTime = Date.now();
  
  // Set timeout to prevent stuck processing
  const timeoutId = setTimeout(() => {
    console.log('⚠️  Auto-processing timeout reached, forcing reset');
    isProcessing = false;
  }, PROCESSING_TIMEOUT);

  try {
    console.log('⏰ Auto-processing cron job running...');
    
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
      batchSize: 1 // Default batch size
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
          config.batchSize = Math.min(MAX_CONCURRENT_POSTS, parseInt(setting.value) || 1);
          break;
      }
    });

    if (!config.enabled) {
      console.log('❌ Auto-processing is disabled');
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
      console.log('📝 No NEW posts to process');
      return;
    }

    console.log(`🔄 Processing ${postsToProcess.length} posts...`);

    // Process each post
    for (const post of postsToProcess) {
      try {
        console.log(`📝 Processing: ${post.title.substring(0, 50)}...`);
        
        // Call the process posts API endpoint
        const response = await fetch(`${API_BASE_URL}/api/posts/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Processed: ${post.title.substring(0, 50)}...`);
        } else {
          console.log(`❌ Failed to process: ${result.error}`);
        }

        // Add delay between posts
        if (post !== postsToProcess[postsToProcess.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, config.delaySeconds * 1000));
        }
      } catch (error) {
        console.log(`❌ Error processing post: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Auto-processing completed in ${duration}ms`);
  } catch (error) {
    console.log(`❌ Auto-processing error: ${error.message}`);
    console.error(error);
  } finally {
    clearTimeout(timeoutId);
    isProcessing = false;
  }
});

// Auto-publish cron job (runs every minute to check for scheduled posts)
cron.schedule('* * * * *', async () => {
  try {
    console.log('⏰ Auto-publish cron job running...');
    
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
          config.enabled = setting.value === 'true';
          break;
        case 'auto_posting_interval_minutes':
          config.intervalMinutes = parseInt(setting.value);
          break;
        case 'auto_posting_batch_size':
          config.batchSize = parseInt(setting.value);
          break;
      }
    });

    if (!config.enabled) {
      console.log('❌ Auto-posting is disabled');
      return;
    }

    console.log('🔄 Checking for posts to auto-publish...');

    // Call the auto-publish API endpoint
    const response = await fetch(`${API_BASE_URL}/api/auto-publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    
    if (result.success && result.data.publishedCount > 0) {
      console.log(`✅ Auto-published ${result.data.publishedCount} posts`);
    } else {
      console.log('📝 No posts to auto-publish');
    }
  } catch (error) {
    console.log(`❌ Auto-publish error: ${error.message}`);
  }
});

// Auto-fetch cron job (runs every 30 minutes)
cron.schedule('*/30 * * * *', async () => {
  try {
    console.log('⏰ Auto-fetch cron job running...');
    
    // Get auto-ingest configuration
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'auto_ingest_enabled'
          ]
        }
      }
    });

    const config = {
      enabled: false
    };

    settings.forEach(setting => {
      if (setting.key === 'auto_ingest_enabled') {
        config.enabled = setting.value === 'true';
      }
    });

    if (!config.enabled) {
      console.log('❌ Auto-ingest is disabled');
      return;
    }

    console.log('🔄 Running auto-fetch...');

    // Call the auto-fetch script
    const { exec } = require('child_process');
    exec('node auto-fetch-cron.js', (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Auto-fetch error: ${error.message}`);
        return;
      }
      console.log('✅ Auto-fetch completed');
    });
  } catch (error) {
    console.log(`❌ Auto-fetch error: ${error.message}`);
  }
});

// Cleanup cron job (runs every hour)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('⏰ Cleanup cron job running...');
    
    // Call the cleanup API endpoint
    const response = await fetch(`${API_BASE_URL}/api/admin/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cleanup completed:', result.data);
    } else {
      console.log('❌ Cleanup failed:', result.error);
    }
  } catch (error) {
    console.log(`❌ Cleanup error: ${error.message}`);
  }
});

console.log('✅ Background job scheduler started successfully!');
console.log('📊 Cron jobs scheduled:');
console.log('  - Auto-processing: Every 2 minutes');
console.log('  - Auto-publish: Every minute');
console.log('  - Auto-fetch: Every 30 minutes');
console.log('  - Cleanup: Every hour');

// Keep the process running
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down background job scheduler...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down background job scheduler...');
  await prisma.$disconnect();
  process.exit(0);
});
