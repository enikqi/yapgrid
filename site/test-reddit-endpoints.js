const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRedditSessionWithDifferentEndpoint() {
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
    
    // Test different Reddit endpoints
    const axios = require('axios');
    
    const endpoints = [
      'https://www.reddit.com/api/me.json',
      'https://www.reddit.com/api/v1/me',
      'https://oauth.reddit.com/api/v1/me',
      'https://www.reddit.com/user/me.json'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\nTesting endpoint: ${endpoint}`);
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'PinReddit/1.0.0',
            'Cookie': sessionConfig.sessionCookie,
          },
          timeout: 10000,
        });

        console.log(`Status: ${response.status}`);
        console.log(`Has data: ${Boolean(response.data)}`);
        console.log(`Has user: ${Boolean(response.data?.data?.name)}`);
        if (response.data?.data?.name) {
          console.log(`Username: ${response.data.data.name}`);
        }
        
        // Show first part of response
        const responseStr = JSON.stringify(response.data, null, 2);
        console.log(`Response preview: ${responseStr.substring(0, 200)}...`);

      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        if (error.response) {
          console.log(`Response status: ${error.response.status}`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRedditSessionWithDifferentEndpoint();
