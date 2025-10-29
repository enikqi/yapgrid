const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewSessionValidation() {
  try {
    // Get session config from database
    const sessionSetting = await prisma.setting.findUnique({
      where: { key: 'reddit_session_config' }
    });

    if (!sessionSetting) {
      console.log('No session config found in database');
      return;
    }

    const sessionConfig = JSON.parse(sessionSetting.value);
    
    // Test new validation method
    const axios = require('axios');
    
    try {
      console.log('Testing new Reddit session validation...');
      
      const response = await axios.get('https://www.reddit.com/r/Funnymemes/new.json?limit=1', {
        headers: {
          'User-Agent': 'PinReddit/1.0.0',
          'Cookie': sessionConfig.sessionCookie,
        },
        timeout: 10000,
      });

      console.log(`Status: ${response.status}`);
      console.log(`Has data: ${Boolean(response.data)}`);
      console.log(`Has children: ${Boolean(response.data?.data?.children)}`);
      
      if (response.data && response.data.data && response.data.data.children && response.data.data.children.length > 0) {
        console.log('✅ Reddit session is VALID with new validation method!');
        console.log(`Posts found: ${response.data.data.children.length}`);
      } else {
        console.log('❌ Reddit session is INVALID with new validation method');
      }

    } catch (error) {
      console.log('❌ Session validation failed:', error.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewSessionValidation();
