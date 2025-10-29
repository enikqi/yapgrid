const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPostStructure() {
  try {
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
        preview: true,
        redditId: true,
        author: true,
        subreddit: true,
        score: true,
        nsfw: true,
        createdUtc: true
      }
    });
    
    if (galleryPost) {
      console.log('📊 DATABASE POST STRUCTURE:');
      console.log('==========================');
      console.log('ID:', galleryPost.id);
      console.log('Title:', galleryPost.title);
      console.log('URL:', galleryPost.url);
      console.log('Reddit ID:', galleryPost.redditId);
      console.log('Author:', galleryPost.author);
      console.log('Subreddit:', galleryPost.subreddit);
      console.log('Score:', galleryPost.score);
      console.log('NSFW:', galleryPost.nsfw);
      console.log('Preview:', galleryPost.preview);
      console.log('Created:', galleryPost.createdUtc);
      console.log('');
      
      console.log('🔍 AVAILABLE FIELDS:');
      console.log('====================');
      Object.keys(galleryPost).forEach(key => {
        console.log(`- ${key}: ${typeof galleryPost[key]}`);
      });
    } else {
      console.log('No gallery posts found');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPostStructure();
