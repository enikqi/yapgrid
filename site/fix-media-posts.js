const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixMediaPosts() {
  try {
    console.log('🔧 FIXING MEDIA POSTS - Converting text posts back to NEW for proper processing')
    
    // Get READY posts that don't have assets (text-only posts)
    const textOnlyPosts = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: { none: {} }
      },
      select: { id: true, title: true, url: true }
    })
    
    console.log(`📊 Found ${textOnlyPosts.length} text-only posts in READY status`)
    
    if (textOnlyPosts.length > 0) {
      console.log('🔄 Converting text-only posts back to NEW for proper processing...')
      
      // Convert text-only posts back to NEW status so they can be properly processed
      const result = await prisma.post.updateMany({
        where: {
          status: 'READY',
          assets: { none: {} }
        },
        data: {
          status: 'NEW',
          processedAt: null,
          scheduledPublishAt: null,
          error: null
        }
      })
      
      console.log(`✅ Converted ${result.count} text-only posts back to NEW status`)
    }
    
    // Now process NEW posts properly to get media
    console.log('\n🔄 Processing NEW posts to get media assets...')
    
    const newPosts = await prisma.post.findMany({
      where: { status: 'NEW' },
      orderBy: { createdUtc: 'asc' },
      take: 100 // Process 100 posts
    })
    
    console.log(`📦 Processing ${newPosts.length} NEW posts...`)
    
    let processed = 0
    for (const post of newPosts) {
      try {
        // Check if this post has media URLs
        const hasMedia = post.url.includes('i.redd.it') || 
                        post.url.includes('v.redd.it') || 
                        post.url.includes('/gallery/') ||
                        post.preview
        
        if (hasMedia) {
          // This post has media - mark as READY
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'READY',
              processedAt: new Date(),
              scheduledPublishAt: new Date(),
              error: null
            }
          })
          processed++
          console.log(`  ✅ ${processed}/${newPosts.length} - Media post: ${post.title.substring(0, 40)}...`)
        } else {
          // Text-only post - mark as FAILED (won't appear on homepage)
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'FAILED',
              processedAt: new Date(),
              error: 'Text-only post - no media for homepage'
            }
          })
          console.log(`  📝 Text post: ${post.title.substring(0, 40)}...`)
        }
        
      } catch (error) {
        console.log(`  ❌ Error processing ${post.id}: ${error.message}`)
      }
    }
    
    // Show final status
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('\n📊 FINAL STATUS:')
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`)
    })
    
    // Count READY posts with media
    const readyWithMedia = await prisma.post.count({
      where: {
        status: 'READY',
        assets: { some: {} }
      }
    })
    
    const readyTextOnly = await prisma.post.count({
      where: {
        status: 'READY',
        assets: { none: {} }
      }
    })
    
    console.log(`\n🎯 READY POSTS BREAKDOWN:`)
    console.log(`  📸 With media: ${readyWithMedia}`)
    console.log(`  📝 Text-only: ${readyTextOnly}`)
    
    console.log(`\n🚀 SUCCESS! Now auto-publish will prioritize media posts!`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMediaPosts()
