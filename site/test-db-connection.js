const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn']
  });

  try {
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection successful:', result);
    
    const postCount = await prisma.post.count();
    console.log('Total posts:', postCount);
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
