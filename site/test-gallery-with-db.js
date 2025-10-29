const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGalleryProcessing() {
  try {
    console.log('🧪 TESTING GALLERY PROCESSING WITH DATABASE POST');
    console.log('===============================================');
    
    // Get a gallery post from the database
    const galleryPost = await prisma.post.findFirst({
      where: { 
        url: {
          contains: '/gallery/'
        }
      },
      select: {
        id: true,
        title: true,
        url: true,
        redditId: true,
        preview: true
      }
    });
    
    if (!galleryPost) {
      console.log('No gallery posts found');
      return;
    }
    
    console.log('Database post structure:');
    console.log('ID:', galleryPost.id);
    console.log('Title:', galleryPost.title);
    console.log('URL:', galleryPost.url);
    console.log('Reddit ID:', galleryPost.redditId);
    console.log('Preview:', galleryPost.preview);
    console.log('');
    
    // Test the gallery URL extraction logic
    let galleryUrl = galleryPost.url;
    if (!galleryUrl && galleryPost.redditId) {
      galleryUrl = `https://www.reddit.com/gallery/${galleryPost.redditId}`;
    }
    
    console.log('Gallery URL:', galleryUrl);
    
    const galleryMatch = galleryUrl.match(/\/gallery\/([a-zA-Z0-9]+)/);
    if (!galleryMatch) {
      console.log('❌ No gallery ID found');
      return;
    }
    
    const galleryId = galleryMatch[1];
    console.log('Gallery ID:', galleryId);
    
    // Test Reddit API call
    const axios = require('axios');
    const redditApiUrl = `https://www.reddit.com/api/info.json?id=t3_${galleryId}`;
    console.log('Reddit API URL:', redditApiUrl);
    
    try {
      const response = await axios.get(redditApiUrl, {
        headers: {
          'User-Agent': 'PinReddit/1.0'
        },
        timeout: 10000
      });
      
      console.log('✅ Reddit API response:', response.status);
      
      if (response.data?.data?.children?.[0]?.data) {
        const galleryData = response.data.data.children[0].data;
        
        if (galleryData.media_metadata) {
          const mediaItems = Object.values(galleryData.media_metadata);
          console.log(`✅ Found ${mediaItems.length} media items`);
          
          if (mediaItems.length > 0) {
            const firstMedia = mediaItems[0];
            if (firstMedia.s?.u) {
              const imageUrl = firstMedia.s.u.replace(/&amp;/g, '&');
              console.log('✅ Gallery image URL:', imageUrl);
            }
          }
        } else {
          console.log('❌ No media_metadata found');
        }
      } else {
        console.log('❌ No gallery data in response');
      }
    } catch (error) {
      console.log('❌ Reddit API error:', error.message);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test error:', error);
  }
}

testGalleryProcessing();
