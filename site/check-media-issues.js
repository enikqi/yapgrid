const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMediaIssues() {
  try {
    // Check posts that should have media but don't
    const postsWithGalleryUrls = await prisma.post.findMany({
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
        preview: true,
        assets: {
          select: {
            id: true,
            type: true,
            url: true
          }
        }
      },
      take: 5
    });
    
    console.log('🖼️ GALLERY POSTS WITHOUT ASSETS:');
    console.log('=================================');
    postsWithGalleryUrls.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title.substring(0, 50)}...`);
      console.log(`   URL: ${post.url}`);
      console.log(`   Preview: ${post.preview ? 'Yes' : 'No'}`);
      console.log(`   Assets: ${post.assets.length}`);
      if (post.assets.length > 0) {
        post.assets.forEach(asset => {
          console.log(`     - ${asset.type}: ${asset.url}`);
        });
      }
      console.log('');
    });
    
    // Check if there are any posts with assets
    const postsWithAssets = await prisma.post.findMany({
      where: { 
        status: 'FAILED',
        assets: {
          some: {}
        }
      },
      select: {
        id: true,
        title: true,
        assets: {
          select: {
            id: true,
            type: true,
            url: true
          }
        }
      },
      take: 3
    });
    
    console.log('📎 FAILED POSTS WITH ASSETS:');
    console.log('============================');
    postsWithAssets.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title.substring(0, 50)}...`);
      console.log(`   Assets: ${post.assets.length}`);
      post.assets.forEach(asset => {
        console.log(`     - ${asset.type}: ${asset.url}`);
      });
      console.log('');
    });
    
    // Check successful posts to compare
    const successfulPosts = await prisma.post.findMany({
      where: { 
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        assets: {
          select: {
            id: true,
            type: true,
            url: true
          }
        }
      },
      take: 3
    });
    
    console.log('✅ SUCCESSFUL POSTS WITH ASSETS:');
    console.log('================================');
    successfulPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title.substring(0, 50)}...`);
      console.log(`   Assets: ${post.assets.length}`);
      post.assets.forEach(asset => {
        console.log(`     - ${asset.type}: ${asset.url}`);
      });
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMediaIssues();
