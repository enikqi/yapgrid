const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCampaignsAndFetching() {
  try {
    console.log('=== CHECKING CAMPAIGNS AND AUTO-FETCHING ===')
    
    // Check campaigns
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        enabled: true,
        subreddits: true,
        createdAt: true
      }
    })
    
    console.log(`\nCampaigns (${campaigns.length}):`)
    campaigns.forEach(campaign => {
      console.log(`- ${campaign.name} (ID: ${campaign.id})`)
      console.log(`  Enabled: ${campaign.enabled}`)
      console.log(`  Subreddits: ${campaign.subreddits}`)
      console.log(`  Created: ${campaign.createdAt}`)
      console.log('')
    })
    
    // Check auto-fetching settings
    const autoFetchSettings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'auto_fetching'
        }
      }
    })
    
    console.log('Auto-fetching settings:')
    if (autoFetchSettings.length === 0) {
      console.log('❌ No auto-fetching settings found!')
    } else {
      autoFetchSettings.forEach(setting => {
        console.log(`- ${setting.key}: ${setting.value}`)
      })
    }
    
    // Check auto-processing settings
    const autoProcessSettings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'auto_processing'
        }
      }
    })
    
    console.log('\nAuto-processing settings:')
    if (autoProcessSettings.length === 0) {
      console.log('❌ No auto-processing settings found!')
    } else {
      autoProcessSettings.forEach(setting => {
        console.log(`- ${setting.key}: ${setting.value}`)
      })
    }
    
    // Check NEW posts
    const newPosts = await prisma.post.findMany({
      where: { status: 'NEW' },
      take: 5,
      select: {
        id: true,
        title: true,
        subreddit: true,
        createdAt: true
      }
    })
    
    console.log(`\nNEW posts (${newPosts.length} shown):`)
    newPosts.forEach(post => {
      console.log(`- ${post.title}`)
      console.log(`  Subreddit: ${post.subreddit}`)
      console.log(`  Created: ${post.createdAt}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCampaignsAndFetching()
