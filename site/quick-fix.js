const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function quickFix() {
  try {
    console.log('🚀 QUICK FIX - Converting NEW posts to READY')
    
    // Get count of NEW posts
    const newCount = await prisma.post.count({
      where: { status: 'NEW' }
    })
    
    console.log(`📊 Found ${newCount} NEW posts`)
    
    if (newCount === 0) {
      console.log('✅ No NEW posts to process')
      return
    }
    
    // Convert ALL NEW posts to READY status immediately
    const result = await prisma.post.updateMany({
      where: { status: 'NEW' },
      data: {
        status: 'READY',
        processedAt: new Date(),
        scheduledPublishAt: new Date(),
        error: null
      }
    })
    
    console.log(`🎉 SUCCESS! Updated ${result.count} posts to READY status`)
    
    // Show final status
    const counts = await prisma.post.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('\n📊 FINAL STATUS:')
    counts.forEach(c => {
      console.log(`  ${c.status}: ${c._count.id}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickFix()
