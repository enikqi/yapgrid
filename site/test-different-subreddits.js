const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDifferentSubreddit() {
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
    
    // Test different subreddits
    const axios = require('axios');
    
    const subreddits = ['Funnymemes', 'CringeTikToks', 'memes', 'funny'];
    
    for (const subreddit of subreddits) {
      try {
        console.log(`\nTesting subreddit: r/${subreddit}...`);
        
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/new.json?limit=5`, {
          headers: {
            'User-Agent': 'PinReddit/1.0.0',
            'Cookie': sessionConfig.sessionCookie,
          },
          timeout: 15000,
        });

        if (response.data?.data?.children) {
          const posts = response.data.data.children.map(child => child.data);
          console.log(`Posts found: ${posts.length}`);
          
          if (posts.length > 0) {
            console.log(`First post: ${posts[0].title} (score: ${posts[0].score})`);
          }
        }

      } catch (error) {
        console.log(`❌ Failed for r/${subreddit}: ${error.message}`);
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

testDifferentSubreddit();
