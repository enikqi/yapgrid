const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Top 50 most active humor/entertainment subreddits
const newSubreddits = [
  'memes', 'dankmemes', 'wholesomememes', 'facepalm', 'holdmybeer',
  'madlads', 'publicfreakout', 'AnimalsBeingDerps', 'CrappyDesign', 
  'unexpected', 'perfectlycutscreams', 'instant_regret', 'Whatcouldgowrong',
  'idiotsincars', 'kidsarefuckingstupid', 'ContagiousLaughter', 'funnyvideos',
  'comedy', 'jokes', 'dadjokes', 'fail', 'epicfail', 'nononono', 'yesyesyesno',
  'AbruptChaos', 'CatastrophicFailure', 'WinStupidPrizes', 'instantkarma',
  'JusticeServed', 'AnimalsBeingBros', 'AnimalsBeingJerks', 'rarepuppers',
  'dogpictures', 'catpictures', 'zoomies', 'tippytaps', 'WhatsWrongWithYourDog',
  'WhatsWrongWithYourCat', 'gaming', 'pcgaming', 'movies', 'television',
  'netflix', 'Marvel', 'DCcomics', 'StarWars', 'lotrmemes', 'PrequelMemes',
  'SequelMemes', 'OTMemes', 'MarvelMemes', 'DCmemes'
];

async function addSubreddits() {
  try {
    console.log('🚀 Adding subreddits to existing campaigns...');
    
    // Get the first campaign to add subreddits to
    const campaign = await prisma.campaign.findFirst({
      where: { enabled: true }
    });
    
    if (!campaign) {
      console.log('❌ No enabled campaigns found');
      return;
    }
    
    console.log(`📝 Found campaign: ${campaign.name}`);
    
    // Parse existing subreddits
    const existingSubreddits = JSON.parse(campaign.subreddits || '[]');
    console.log(`📊 Current subreddits: ${existingSubreddits.length}`);
    
    // Add new subreddits (avoid duplicates)
    const allSubreddits = [...new Set([...existingSubreddits, ...newSubreddits])];
    const addedCount = allSubreddits.length - existingSubreddits.length;
    
    console.log(`➕ Adding ${addedCount} new subreddits`);
    console.log(`📈 Total subreddits will be: ${allSubreddits.length}`);
    
    // Update campaign
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        subreddits: JSON.stringify(allSubreddits),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Successfully updated campaign with new subreddits!');
    console.log('\n🎯 New subreddits added:');
    newSubreddits.forEach(sub => {
      if (!existingSubreddits.includes(sub)) {
        console.log(`  - r/${sub}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addSubreddits();
