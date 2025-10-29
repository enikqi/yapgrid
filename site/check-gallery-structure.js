const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGalleryPost() {
  try {
    // Get a gallery post to examine its structure
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
        preview: true
      }
    });
    
    if (galleryPost) {
      console.log('🖼️ GALLERY POST STRUCTURE:');
      console.log('==========================');
      console.log('ID:', galleryPost.id);
      console.log('Title:', galleryPost.title);
      console.log('URL:', galleryPost.url);
      console.log('Preview:', galleryPost.preview);
      console.log('');
      
      // Extract gallery ID from URL
      const galleryMatch = galleryPost.url.match(/\/gallery\/([a-zA-Z0-9]+)/);
      if (galleryMatch) {
        const galleryId = galleryMatch[1];
        console.log('Gallery ID:', galleryId);
        console.log('');
        
        // Try to fetch gallery data from Reddit API
        console.log('🔗 REDDIT API URL:');
        console.log(`https://www.reddit.com/api/info.json?id=t3_${galleryId}`);
      }
    } else {
      console.log('No gallery posts found');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkGalleryPost();
