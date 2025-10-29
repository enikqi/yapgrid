const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRedditSession() {
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
    console.log('Session cookie (first 100 chars):', sessionConfig.sessionCookie.substring(0, 100));
    
    // Test session directly with axios
    const axios = require('axios');
    
    try {
      const response = await axios.get('https://www.reddit.com/api/me.json', {
        headers: {
          'User-Agent': 'PinReddit/1.0.0',
          'Cookie': sessionConfig.sessionCookie,
        },
        timeout: 10000,
      });

      console.log('Full Reddit API response:');
      console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
      console.log('❌ Reddit session test failed:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRedditSession();
