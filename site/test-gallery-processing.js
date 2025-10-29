const { PrismaClient } = require('@prisma/client');
const { MediaDownloader } = require('./lib/media/downloader');

const prisma = new PrismaClient();

async function testGalleryProcessing() {
  try {
    console.log('🧪 TESTING GALLERY POST PROCESSING');
    console.log('==================================');
    
    // Get a few failed gallery posts
    const galleryPosts = await prisma.post.findMany({
      where: { 
        status: 'FAILED',
        url: {
          contains: '/gallery/'
        }
      },
      select: {
        id: true,
        title: true,
        url: true,
        preview: true
      },
      take: 3
    });
    
    console.log(`Found ${galleryPosts.length} gallery posts to test`);
    console.log('');
    
    const downloader = new MediaDownloader();
    
    for (const post of galleryPosts) {
      console.log(`Testing post: ${post.title.substring(0, 50)}...`);
      console.log(`URL: ${post.url}`);
      
      try {
        // Test the getMediaUrl method
        const mediaUrl = await downloader.getMediaUrl(post);
        
        if (mediaUrl) {
          console.log(`✅ SUCCESS: Found media URL: ${mediaUrl}`);
          
          // Try to download the media
          const mediaInfo = await downloader.downloadMedia(post, post.id);
          
          if (mediaInfo) {
            console.log(`✅ DOWNLOAD SUCCESS: ${mediaInfo.filename}`);
            console.log(`   Type: ${mediaInfo.type}`);
            console.log(`   Size: ${mediaInfo.size} bytes`);
            console.log(`   Dimensions: ${mediaInfo.width}x${mediaInfo.height}`);
          } else {
            console.log(`❌ DOWNLOAD FAILED: No media info returned`);
          }
        } else {
          console.log(`❌ FAILED: No media URL found`);
        }
      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
      }
      
      console.log('');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGalleryProcessing();
