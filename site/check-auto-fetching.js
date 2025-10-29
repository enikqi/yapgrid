const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAutoFetching() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'auto_fetching'
        }
      }
    })
    
    console.log('Auto-fetching settings:')
    settings.forEach(s => {
      console.log(`${s.key}: ${s.value}`)
    })
    
    // Check campaigns
    const campaigns = await prisma.campaign.findMany({
      where: { enabled: true }
    })
    
    console.log(`\nEnabled campaigns: ${campaigns.length}`)
    campaigns.forEach(c => {
      console.log(`- ${c.name}: ${c.subreddits}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAutoFetching()

