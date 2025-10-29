const { PrismaClient } = require('@prisma/client')

async function setAdmin() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Setting admin user...')
    
    const user = await prisma.user.update({
      where: { email: 'admin@yapgrid.com' },
      data: { isAdmin: true }
    })
    
    console.log('Admin user updated successfully:', user.email, 'isAdmin:', user.isAdmin)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

setAdmin()

