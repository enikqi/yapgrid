const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRedditSessionWithSubreddit() {
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
    
    // Test fetching posts from a subreddit
    const axios = require('axios');
    
    try {
      console.log('Testing Reddit session by fetching posts from r/Funnymemes...');
      
      const response = await axios.get('https://www.reddit.com/r/Funnymemes/new.json?limit=5', {
        headers: {
          'User-Agent': 'PinReddit/1.0.0',
          'Cookie': sessionConfig.sessionCookie,
        },
        timeout: 15000,
      });

      console.log(`Status: ${response.status}`);
      console.log(`Has data: ${Boolean(response.data)}`);
      console.log(`Has children: ${Boolean(response.data?.data?.children)}`);
      
      if (response.data?.data?.children) {
        console.log(`Posts found: ${response.data.data.children.length}`);
        
        // Show first post
        if (response.data.data.children.length > 0) {
          const firstPost = response.data.data.children[0].data;
          console.log(`First post: ${firstPost.title}`);
          console.log(`Author: ${firstPost.author}`);
          console.log(`Score: ${firstPost.score}`);
        }
        
        console.log('✅ Reddit session is working for fetching posts!');
      } else {
        console.log('❌ No posts found');
      }

    } catch (error) {
      console.log('❌ Failed to fetch posts:', error.message);
      if (error.response) {
        console.log(`Response status: ${error.response.status}`);
        console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRedditSessionWithSubreddit();
