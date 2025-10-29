const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRedditSessionDirectly() {
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
    console.log('Session config from database:', {
      enabled: sessionConfig.enabled,
      hasCookie: Boolean(sessionConfig.sessionCookie),
      cookieLength: sessionConfig.sessionCookie ? sessionConfig.sessionCookie.length : 0
    });

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

      console.log('Reddit API response:', {
        status: response.status,
        hasData: Boolean(response.data),
        hasUser: Boolean(response.data?.data?.name),
        username: response.data?.data?.name
      });

      if (response.data && response.data.data && response.data.data.name) {
        console.log('✅ Reddit session is VALID!');
        console.log('Username:', response.data.data.name);
      } else {
        console.log('❌ Reddit session is INVALID - no user data');
      }
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

testRedditSessionDirectly();
