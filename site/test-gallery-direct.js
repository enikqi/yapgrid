// Test the gallery processing directly
const axios = require('axios');

async function testGalleryProcessing() {
  try {
    console.log('🧪 TESTING GALLERY PROCESSING DIRECTLY');
    console.log('======================================');
    
    // Test with a known gallery post
    const galleryUrl = 'https://www.reddit.com/gallery/1o64ip9';
    const galleryMatch = galleryUrl.match(/\/gallery\/([a-zA-Z0-9]+)/);
    
    if (!galleryMatch) {
      console.log('❌ No gallery ID found');
      return;
    }
    
    const galleryId = galleryMatch[1];
    console.log(`Gallery ID: ${galleryId}`);
    
    // Fetch gallery data from Reddit API
    const redditApiUrl = `https://www.reddit.com/api/info.json?id=t3_${galleryId}`;
    console.log(`Fetching from: ${redditApiUrl}`);
    
    const response = await axios.get(redditApiUrl, {
      headers: {
        'User-Agent': 'PinReddit/1.0'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data structure:', Object.keys(response.data));
    
    if (!response.data?.data?.children?.[0]?.data) {
      console.log('❌ No gallery data found in API response');
      return;
    }
    
    const galleryData = response.data.data.children[0].data;
    console.log('Gallery data keys:', Object.keys(galleryData));
    
    // Check if it has media_metadata (gallery images)
    if (galleryData.media_metadata) {
      console.log('✅ Found media_metadata');
      const mediaItems = Object.values(galleryData.media_metadata);
      console.log(`Media items count: ${mediaItems.length}`);
      
      if (mediaItems.length > 0) {
        const firstMedia = mediaItems[0];
        console.log('First media item keys:', Object.keys(firstMedia));
        
        if (firstMedia.s?.u) {
          const imageUrl = firstMedia.s.u.replace(/&amp;/g, '&');
          console.log(`✅ Found gallery image: ${imageUrl}`);
        } else {
          console.log('❌ No image URL in first media item');
        }
      }
    } else {
      console.log('❌ No media_metadata found');
    }
    
    // Check preview images as fallback
    if (galleryData.preview?.images?.[0]?.source?.url) {
      const encodedUrl = galleryData.preview.images[0].source.url;
      const imageUrl = encodedUrl.replace(/&amp;/g, '&');
      console.log(`✅ Found preview image: ${imageUrl}`);
    } else {
      console.log('❌ No preview images found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testGalleryProcessing();
