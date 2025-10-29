const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// OpenRouter API for title optimization
const OPENROUTER_API_KEY = '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';

async function optimizeTitle(originalTitle, subreddit, contentType) {
  try {
    const prompt = `Optimize this Reddit post title for better SEO and engagement:

Original Title: "${originalTitle}"
Subreddit: r/${subreddit}
Content Type: ${contentType}

Requirements:
1. Keep the core meaning intact
2. Make it more engaging and clickable
3. Improve SEO with relevant keywords
4. Keep it under 100 characters
5. Make it sound natural and appealing
6. Add emotional triggers if appropriate
7. Include relevant keywords for the subreddit topic

Return only the optimized title, no explanations or quotes.`;

    const models = [
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-8b-instruct:free'
    ];

    for (const model of models) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://yapgrid.com',
            'X-Title': 'YapGrid Title Optimizer'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are an SEO expert specializing in creating engaging, clickable titles for social media content.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 100,
            temperature: 0.7,
            top_p: 0.9
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.choices && data.choices.length > 0) {
            const optimizedTitle = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
            if (optimizedTitle && optimizedTitle !== originalTitle && optimizedTitle.length > 0) {
              console.log(`✅ Title optimized: "${originalTitle}" → "${optimizedTitle}"`);
              return optimizedTitle;
            }
          }
        }
      } catch (error) {
        console.warn(`Model ${model} failed:`, error.message);
        continue;
      }
    }

    console.log(`⚠️ Title optimization failed for: "${originalTitle}"`);
    return originalTitle;
  } catch (error) {
    console.error('Title optimization error:', error);
    return originalTitle;
  }
}

async function autoPublishPosts() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] === AUTO-PUBLISH SYSTEM ===`);
    
    // Get auto-publish settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'autoPublish',
            'autoPublishIntervalMinutes', 
            'autoPublishBatchSize'
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
        case 'autoPublish':
          config.enabled = setting.value === 'true';
          break;
        case 'autoPublishIntervalMinutes':
          config.intervalMinutes = parseInt(setting.value);
          break;
        case 'autoPublishBatchSize':
          config.batchSize = parseInt(setting.value);
          break;
      }
    });

    console.log(`Settings: enabled=${config.enabled}, batchSize=${config.batchSize}, interval=${config.intervalMinutes}min`);

    if (!config.enabled) {
      console.log('❌ Auto-publishing is disabled');
      return;
    }

    // Get READY posts for auto-publishing - PRIORITIZE MEDIA POSTS
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'READY'
      },
      include: {
        assets: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: config.batchSize * 3, // Get more posts to prioritize media
    });

    // Prioritize posts with media assets (for homepage)
    const postsWithAssets = readyPosts.filter(p => p.assets && p.assets.length > 0);
    const textOnlyPosts = readyPosts.filter(p => !p.assets || p.assets.length === 0);
    
    // For homepage, prioritize media posts. Only use text posts if no media available
    let finalPosts = postsWithAssets.slice(0, config.batchSize);
    
    // If we don't have enough media posts, add some text posts
    if (finalPosts.length < config.batchSize) {
      const needed = config.batchSize - finalPosts.length;
      finalPosts = [...finalPosts, ...textOnlyPosts.slice(0, needed)];
    }

    if (finalPosts.length === 0) {
      console.log('📭 No posts ready to publish');
      return;
    }

    console.log(`📝 Found ${finalPosts.length} posts ready to publish`);
    console.log(`  📸 Posts with media: ${postsWithAssets.length}`);
    console.log(`  📝 Text-only posts: ${textOnlyPosts.length}`);

    // Update posts to PUBLISHED status with title optimization
    const publishedPosts = await Promise.all(
      finalPosts.map(async (post) => {
        // Optimize title before publishing
        const contentType = post.assets.some(a => a.type === 'VIDEO') ? 'video' : 
                           post.assets.some(a => a.type === 'THUMBNAIL') ? 'image' : 'text';
        
        const optimizedTitle = await optimizeTitle(post.title, post.subreddit, contentType);
        
        return await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            title: optimizedTitle, // Use optimized title
            updatedAt: new Date()
          }
        });
      })
    );

    console.log(`✅ Published ${publishedPosts.length} posts:`);
    publishedPosts.forEach(post => {
      console.log(`  - ${post.title.substring(0, 50)}...`);
    });

    // Show current status
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('\n📊 Current Status:');
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`);
    });

  } catch (error) {
    console.error('❌ Auto-publish error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run immediately
autoPublishPosts();

// Run every 1 minute (60 seconds)
console.log('🚀 Auto-publish system started - will run every 1 minute');
setInterval(autoPublishPosts, 60 * 1000);
