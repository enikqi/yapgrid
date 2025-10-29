// Test MediaDownloader directly with a database post
const { PrismaClient } = require('@prisma/client');

// Import MediaDownloader (we'll need to compile TypeScript first)
async function testMediaDownloader() {
  try {
    console.log('🧪 TESTING MEDIADOWNLOADER DIRECTLY');
    console.log('===================================');
    
    const prisma = new PrismaClient();
    
    // Get a gallery post from the database
    const galleryPost = await prisma.post.findFirst({
      where: { 
        url: {
          contains: '/gallery/'
        }
      }
    });
    
    if (!galleryPost) {
      console.log('No gallery posts found');
      return;
    }
    
    console.log('Testing with post:', galleryPost.title);
    console.log('URL:', galleryPost.url);
    
    // Test the getMediaUrl method logic directly
    const axios = require('axios');
    
    // Simulate the getGalleryImageUrl method
    let galleryUrl = galleryPost.url;
    if (!galleryUrl && galleryPost.redditId) {
      galleryUrl = `https://www.reddit.com/gallery/${galleryPost.redditId}`;
    }
    
    const galleryMatch = galleryUrl.match(/\/gallery\/([a-zA-Z0-9]+)/);
    if (!galleryMatch) {
      console.log('❌ No gallery ID found');
      return;
    }
    
    const galleryId = galleryMatch[1];
    console.log('Gallery ID:', galleryId);
    
    const redditApiUrl = `https://www.reddit.com/api/info.json?id=t3_${galleryId}`;
    console.log('Fetching from:', redditApiUrl);
    
    const response = await axios.get(redditApiUrl, {
      headers: {
        'User-Agent': 'PinReddit/1.0'
      },
      timeout: 10000
    });
    
    if (!response.data?.data?.children?.[0]?.data) {
      console.log('❌ No gallery data found');
      return;
    }
    
    const galleryData = response.data.data.children[0].data;
    
    if (galleryData.media_metadata) {
      const mediaItems = Object.values(galleryData.media_metadata);
      if (mediaItems.length > 0) {
        const firstMedia = mediaItems[0];
        if (firstMedia.s?.u) {
          const imageUrl = firstMedia.s.u.replace(/&amp;/g, '&');
          console.log('✅ Found image URL:', imageUrl);
          
          // Test if we can download the image
          console.log('Testing image download...');
          try {
            const imageResponse = await axios({
              method: 'GET',
              url: imageUrl,
              responseType: 'stream',
              timeout: 30000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
              }
            });
            
            console.log('✅ Image download successful, status:', imageResponse.status);
            console.log('Content-Type:', imageResponse.headers['content-type']);
            console.log('Content-Length:', imageResponse.headers['content-length']);
            
          } catch (downloadError) {
            console.log('❌ Image download failed:', downloadError.message);
          }
        }
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test error:', error);
  }
}

testMediaDownloader();
