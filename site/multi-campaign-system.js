const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

let isRunning = false
let campaignIndex = 0 // Për të rotuar kampanjat

async function runMultiCampaignSystem() {
  if (isRunning) {
    console.log('⏭️ System already running, skipping...')
    return
  }

  isRunning = true
  
  try {
    console.log(`\n[${new Date().toLocaleTimeString()}] === MULTI-CAMPAIGN AUTO SYSTEM ===`)

    // 1. AUTO-FETCH - Merr nga kampanje të ndryshme
    console.log('\n1️⃣ Running multi-campaign auto-fetch...')
    try {
      const campaigns = await prisma.campaign.findMany({
        where: { enabled: true },
        orderBy: { createdAt: 'asc' }
      })

      console.log(`📡 Found ${campaigns.length} enabled campaigns`)

      if (campaigns.length > 0) {
        // Rotu kampanjat - merr kampanjen e radhës
        const campaign = campaigns[campaignIndex % campaigns.length]
        campaignIndex++
        
        console.log(`🎯 Fetching from campaign ${campaignIndex}/${campaigns.length}: ${campaign.name}`)
        console.log(`📋 Subreddits: ${campaign.subreddits.join(', ')}`)
        
        const response = await fetch(`http://localhost:3002/api/campaigns/${campaign.id}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 2 }) // Vetëm 2 postime për të shmangur duplikatet
        })

        if (response.ok) {
          const result = await response.json()
          const saved = result.data?.postsSaved || 0
          console.log(`✅ Fetched: ${saved} new posts from ${campaign.name}`)
          
          if (saved === 0) {
            console.log(`⚠️ No new posts from ${campaign.name} - will try next campaign`)
          }
        } else {
          console.log(`❌ Fetch failed for ${campaign.name}: ${response.status}`)
        }
      }
    } catch (error) {
      console.log(`❌ Auto-fetch error: ${error.message}`)
    }

    // Prit 3 sekonda
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 2. AUTO-PROCESS - Proceson 3 postime NEW
    console.log('\n2️⃣ Running auto-processing...')
    try {
      const response = await fetch('http://localhost:3002/api/posts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 3 })
      })

      if (response.ok) {
        const result = await response.json()
        const processed = result.data?.processedCount || 0
        console.log(`✅ Processed: ${processed} posts`)
      } else {
        console.log(`⚠️ Processing failed: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Auto-process error: ${error.message}`)
    }

    // Prit 3 sekonda
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 3. AUTO-PUBLISH - Publikon 2 postime READY
    console.log('\n3️⃣ Running auto-publishing...')
    try {
      const response = await fetch('http://localhost:3002/api/auto-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 2 })
      })

      if (response.ok) {
        const result = await response.json()
        const published = result.data?.publishedCount || 0
        console.log(`✅ Published: ${published} posts`)
      } else {
        console.log(`⚠️ Publishing failed: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Auto-publish error: ${error.message}`)
    }

    // Kontrollo statusin
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    console.log('\n📊 Current Status:')
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`)
    })

    // Kontrollo kampanjat
    const campaignStats = await prisma.campaign.findMany({
      where: { enabled: true },
      select: {
        name: true,
        subreddits: true,
        _count: {
          select: { posts: true }
        }
      }
    })

    console.log('\n📈 Campaign Stats:')
    campaignStats.forEach(campaign => {
      console.log(`  ${campaign.name}: ${campaign._count.posts} posts`)
    })

  } catch (error) {
    console.error('System error:', error)
  } finally {
    isRunning = false
  }
}

// Ekzekuto menjëherë dhe pastaj çdo 45 sekonda
console.log('🚀 Starting Multi-Campaign Auto System...')
console.log('⏰ Running every 45 seconds')
console.log('🔄 Rotating through all campaigns')
console.log('Press Ctrl+C to stop\n')

runMultiCampaignSystem() // Ekzekuto menjëherë

const interval = setInterval(runMultiCampaignSystem, 45000) // Çdo 45 sekonda

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Stopping Multi-Campaign Auto System...')
  clearInterval(interval)
  await prisma.$disconnect()
  process.exit(0)
})
