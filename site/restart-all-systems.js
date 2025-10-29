const { exec } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restartAllSystems() {
  try {
    console.log('🚀 RESTARTING ALL SYSTEMS...');
    
    // Kill existing processes
    console.log('1. Killing existing Node.js processes...');
    await new Promise((resolve) => {
      exec('taskkill /F /IM node.exe', (error) => {
        if (error && !error.message.includes('no running instance')) {
          console.log('⚠️ Some processes might still be running');
        }
        resolve();
      });
    });
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start Next.js server
    console.log('2. Starting Next.js server...');
    exec('start cmd.exe /k "npm run dev -- -p 3002"', (error) => {
      if (error) console.log('❌ Error starting Next.js:', error.message);
      else console.log('✅ Next.js server started');
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Start auto-publish system
    console.log('3. Starting auto-publish system...');
    exec('start cmd.exe /k "node auto-publish-system.js"', (error) => {
      if (error) console.log('❌ Error starting auto-publish:', error.message);
      else console.log('✅ Auto-publish system started');
    });
    
    // Start slow-integrated system (fetching)
    console.log('4. Starting slow-integrated system...');
    exec('start cmd.exe /k "node slow-integrated-system.js"', (error) => {
      if (error) console.log('❌ Error starting slow-integrated:', error.message);
      else console.log('✅ Slow-integrated system started');
    });
    
    // Start continuous processor
    console.log('5. Starting continuous processor...');
    exec('start cmd.exe /k "node continuous-processor.js"', (error) => {
      if (error) console.log('❌ Error starting continuous processor:', error.message);
      else console.log('✅ Continuous processor started');
    });
    
    // Check database status
    console.log('6. Checking database status...');
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('📊 CURRENT POST STATUS:');
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`);
    });
    
    console.log('\n🎉 ALL SYSTEMS RESTARTED!');
    console.log('📋 Check the opened console windows to monitor each system.');
    console.log('🌐 Visit http://localhost:3002 to see the site');
    console.log('⚙️ Visit http://localhost:3002/admin to configure settings');
    
  } catch (error) {
    console.error('❌ Error restarting systems:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restartAllSystems();
