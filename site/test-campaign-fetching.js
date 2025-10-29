const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCampaignFetching() {
  try {
    console.log('=== TESTING CAMPAIGN FETCHING ===')
    
    // Get enabled campaigns
    const campaigns = await prisma.campaign.findMany({
      where: { enabled: true },
      take: 1
    })
    
    if (campaigns.length === 0) {
      console.log('❌ No enabled campaigns found!')
      return
    }
    
    const campaign = campaigns[0]
    console.log(`Testing campaign: ${campaign.name}`)
    console.log(`Subreddits: ${campaign.subreddits}`)
    
    // Test fetching from this campaign
    try {
      const response = await fetch(`http://localhost:3002/api/campaigns/${campaign.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Campaign run successful!')
        console.log(`- Posts fetched: ${result.data.postsFetched}`)
        console.log(`- Posts saved: ${result.data.postsSaved}`)
        console.log(`- Media downloaded: ${result.data.mediaDownloaded}`)
      } else {
        console.log('❌ Campaign run failed:', result.error)
      }
      
    } catch (error) {
      console.error('❌ Error calling campaign API:', error)
    }
    
    // Check for new posts after fetching
    const newPosts = await prisma.post.findMany({
      where: { 
        status: 'NEW',
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 1000) // Last 2 minutes
        }
      },
      take: 3,
      select: {
        title: true,
        subreddit: true,
        createdAt: true
      }
    })
    
    console.log(`\nNew posts fetched (${newPosts.length}):`)
    newPosts.forEach(post => {
      console.log(`- ${post.title}`)
      console.log(`  Subreddit: ${post.subreddit}`)
      console.log(`  Created: ${post.createdAt}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCampaignFetching()
