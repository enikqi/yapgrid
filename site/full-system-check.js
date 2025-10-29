const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fullSystemCheck() {
  try {
    console.log('=== FULL SYSTEM CHECK ===\n')

    // 1. Check current status
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('Current post counts:')
    counts.forEach(c => {
      console.log(`${c.status}: ${c._count.id}`)
    })

    // 2. Check READY posts with assets
    const readyWithAssets = await prisma.post.findMany({
      where: {
        status: 'READY',
        assets: { some: {} }
      },
      take: 5,
      include: { assets: true }
    })

    console.log(`\nREADY posts with assets: ${readyWithAssets.length}`)
    readyWithAssets.forEach(post => {
      console.log(`- ${post.title} (${post.assets.length} assets)`)
    })

    // 3. Check NEW posts
    const newPosts = await prisma.post.findMany({
      where: { status: 'NEW' },
      take: 5
    })

    console.log(`\nNEW posts: ${newPosts.length}`)
    newPosts.forEach(post => {
      console.log(`- ${post.title}`)
    })

    // 4. Check campaigns
    const campaigns = await prisma.campaign.findMany({
      where: { enabled: true }
    })

    console.log(`\nActive campaigns: ${campaigns.length}`)
    campaigns.forEach(campaign => {
      console.log(`- ${campaign.name}`)
    })

    // 5. Check auto-posting settings
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ['autoPublish', 'autoPublishIntervalMinutes', 'autoPublishBatchSize'] }
      }
    })

    console.log('\nAuto-posting settings:')
    settings.forEach(s => {
      console.log(`${s.key}: ${s.value}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fullSystemCheck()

