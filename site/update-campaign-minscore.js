const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCampaignMinScore() {
  try {
    // Update Funny Memes campaign to have lower minScore
    const campaign = await prisma.campaign.findFirst({
      where: {
        name: {
          contains: 'Funny Memes'
        }
      }
    });

    if (campaign) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { minScore: 1 }
      });
      
      console.log(`Updated ${campaign.name} minScore from ${campaign.minScore} to 1`);
    } else {
      console.log('Campaign not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCampaignMinScore();
