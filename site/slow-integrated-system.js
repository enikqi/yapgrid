const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function slowIntegratedSystem() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] === SLOW INTEGRATED SYSTEM ===`)

      // 1. Auto-fetch - fetch from ALL active campaigns
      console.log('1. Running auto-fetch from all campaigns...')
      try {
        const campaigns = await prisma.campaign.findMany({
          where: { enabled: true },
          orderBy: { createdAt: 'asc' }
        })

        if (campaigns.length > 0) {
          console.log(`📡 Found ${campaigns.length} active campaigns`)
          
          let totalPostsSaved = 0
          
          // Fetch from ALL campaigns in parallel
          // Note: Duplicate prevention is handled in the campaign API by checking redditId uniqueness
          const fetchPromises = campaigns.map(async (campaign) => {
            try {
              const subreddits = Array.isArray(campaign.subreddits) ? campaign.subreddits : []
              console.log(`  📡 Fetching from: ${campaign.name} (${subreddits.join(', ')})`)
              
              const response = await fetch(`http://localhost:3002/api/campaigns/${campaign.id}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: 10 }) // 10 posts per campaign
              })
            
              if (response.ok) {
                const result = await response.json()
                const postsSaved = result.data?.postsSaved || 0
                console.log(`  ✅ ${campaign.name}: ${postsSaved} posts saved`)
                
                // Update campaign timestamp
                await prisma.campaign.update({
                  where: { id: campaign.id },
                  data: { updatedAt: new Date() }
                })
                
                return postsSaved
              } else {
                console.log(`  ⚠️ ${campaign.name}: fetch failed (${response.status})`)
                return 0
              }
            } catch (error) {
              console.log(`  ⚠️ ${campaign.name}: error - ${error.message}`)
              return 0
            }
          })
          
          // Wait for all campaigns to complete
          const results = await Promise.all(fetchPromises)
          totalPostsSaved = results.reduce((sum, count) => sum + count, 0)
          
          console.log(`✅ Auto-fetch completed: ${totalPostsSaved} total posts saved from ${campaigns.length} campaigns`)
        }
    } catch (error) {
      console.log('⚠️ Auto-fetch failed:', error.message)
    }

    // 2. Auto-process - process MORE posts to keep READY queue filled
    console.log('2. Running auto-processing (100 posts with progress)...')
    try {
      // Process posts in batches of 50 to avoid timeouts
      const batchSize = 50
      const totalBatches = 2 // Process 100 posts total
      let totalProcessed = 0
      
      for (let batch = 1; batch <= totalBatches; batch++) {
        console.log(`  📊 Processing batch ${batch}/${totalBatches} (${batchSize} posts)...`)
        
        const response = await fetch('http://localhost:3002/api/posts/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchSize })
        })
        
        if (response.ok) {
          const result = await response.json()
          const processed = result.data?.processedCount || 0
          totalProcessed += processed
          
          // Progress bar
          const progress = Math.round((batch / totalBatches) * 100)
          const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5))
          console.log(`  ${bar} ${progress}% - Batch ${batch}: ${processed} posts processed`)
          
          // Small delay between batches to prevent overwhelming the system
          if (batch < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } else {
          console.log(`  ⚠️ Batch ${batch} failed: ${response.status}`)
        }
      }
      
      console.log(`✅ Auto-processing completed: ${totalProcessed} total posts processed`)
    } catch (error) {
      console.log('⚠️ Auto-processing failed:', error.message)
    }

    // 3. Auto-publish - publish posts based on settings
    console.log('3. Running auto-publishing...')
    try {
      const response = await fetch('http://localhost:3002/api/auto-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Use default settings from database
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Auto-publishing: ${result.data?.publishedCount || 0} posts published`)
      }
    } catch (error) {
      console.log('⚠️ Auto-publishing failed:', error.message)
    }

    // 4. Show current status
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('\n📊 Current Status:')
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`)
    })

    const readyWithAssets = await prisma.post.count({
      where: {
        status: 'READY',
        assets: { some: {} }
      }
    })
    console.log(`  READY with assets: ${readyWithAssets}`)

    const newPosts = await prisma.post.count({
      where: { status: 'NEW' }
    })
    console.log(`  NEW posts waiting: ${newPosts}`)

  } catch (error) {
    console.error('❌ System error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run immediately
slowIntegratedSystem()

// Run every 5 minutes (300 seconds) for faster processing
console.log('🚀 Enhanced auto-processing system started - will run every 5 minutes')
setInterval(slowIntegratedSystem, 300 * 1000)
