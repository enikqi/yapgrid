const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeJobSettings() {
  console.log('🔧 Initializing job settings...');
  
  try {
    await prisma.setting.upsert({
      where: { key: 'auto_processing_enabled' },
      update: {},
      create: { key: 'auto_processing_enabled', value: 'true' }
    });
    
    await prisma.setting.upsert({
      where: { key: 'auto_processing_delay_seconds' },
      update: {},
      create: { key: 'auto_processing_delay_seconds', value: '10' }
    });
    
    await prisma.setting.upsert({
      where: { key: 'auto_processing_batch_size' },
      update: {},
      create: { key: 'auto_processing_batch_size', value: '10' }
    });
    
    await prisma.setting.upsert({
      where: { key: 'auto_posting_enabled' },
      update: {},
      create: { key: 'auto_posting_enabled', value: 'true' }
    });
    
    await prisma.setting.upsert({
      where: { key: 'auto_posting_interval_minutes' },
      update: {},
      create: { key: 'auto_posting_interval_minutes', value: '30' }
    });
    
    await prisma.setting.upsert({
      where: { key: 'auto_posting_batch_size' },
      update: {},
      create: { key: 'auto_posting_batch_size', value: '5' }
    });
    
    await prisma.setting.upsert({
      where: { key: 'auto_ingest_enabled' },
      update: {},
      create: { key: 'auto_ingest_enabled', value: 'true' }
    });
    
    console.log('✅ Job settings initialized!');
    
    const allSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'auto_processing_enabled',
            'auto_processing_delay_seconds',
            'auto_processing_batch_size',
            'auto_posting_enabled',
            'auto_posting_interval_minutes',
            'auto_posting_batch_size',
            'auto_ingest_enabled'
          ]
        }
      }
    });
    
    console.log('\n📊 Current Settings:');
    allSettings.forEach(setting => {
      console.log(`  ${setting.key}: ${setting.value}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeJobSettings();
