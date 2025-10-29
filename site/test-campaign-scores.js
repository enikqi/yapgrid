const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCampaignWithLowerScore() {
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
    
    // Test fetching posts with different minScore values
    const axios = require('axios');
    
    const minScores = [0, 1, 5, 10];
    
    for (const minScore of minScores) {
      try {
        console.log(`\nTesting with minScore=${minScore}...`);
        
        const response = await axios.get(`https://www.reddit.com/r/Funnymemes/new.json?limit=10`, {
          headers: {
            'User-Agent': 'PinReddit/1.0.0',
            'Cookie': sessionConfig.sessionCookie,
          },
          timeout: 15000,
        });

        if (response.data?.data?.children) {
          const posts = response.data.data.children.map(child => child.data);
          const filteredPosts = posts.filter(post => post.score >= minScore);
          
          console.log(`Total posts: ${posts.length}`);
          console.log(`Posts with score >= ${minScore}: ${filteredPosts.length}`);
          
          if (filteredPosts.length > 0) {
            console.log(`First post: ${filteredPosts[0].title} (score: ${filteredPosts[0].score})`);
          }
        }

      } catch (error) {
        console.log(`❌ Failed with minScore=${minScore}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCampaignWithLowerScore();
