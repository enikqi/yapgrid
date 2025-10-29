const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive list of 100+ active subreddits for humor and entertainment
const subreddits = [
  // HUMOR & MEMES (Top Tier)
  'funny', 'memes', 'dankmemes', 'wholesomememes', 'facepalm', 'holdmybeer',
  'therewasanattempt', 'madlads', 'publicfreakout', 'AnimalsBeingDerps',
  'ProgrammerHumor', 'CrappyDesign', 'unexpected', 'perfectlycutscreams',
  'instant_regret', 'Whatcouldgowrong', 'idiotsincars', 'kidsarefuckingstupid',
  'ContagiousLaughter', 'funnyvideos', 'comedy', 'jokes', 'dadjokes',
  
  // FAILS & EPIC FAILS
  'fail', 'epicfail', 'nononono', 'yesyesyesno', 'AbruptChaos', 'CatastrophicFailure',
  'WinStupidPrizes', 'instantkarma', 'JusticeServed', 'petttyrevenge',
  
  // ANIMALS & PETS
  'cats', 'dogs', 'Awww', 'FunnyAnimals', 'AnimalsBeingBros', 'AnimalsBeingJerks',
  'rarepuppers', 'dogpictures', 'catpictures', 'zoomies', 'tippytaps',
  'WhatsWrongWithYourDog', 'WhatsWrongWithYourCat', 'DogShowerThoughts',
  
  // GAMING & TECH HUMOR
  'gaming', 'pcgaming', 'pcmasterrace', 'buildapc', 'leagueoflegends', 'Eldenring',
  'Silksong', 'Genshin_Impact', 'cyberpunkgame', '3Dprinting', 'ChatGPT', 'OpenAI',
  'AskElectronics', 'ProgrammerHumor', 'ProgrammerDadJokes', 'softwaregore',
  'techsupportgore', 'itsaunixsystem', 'programminghorror',
  
  // ENTERTAINMENT & POP CULTURE
  'movies', 'television', 'netflix', 'Marvel', 'DCcomics', 'StarWars', 'lotrmemes',
  'PrequelMemes', 'SequelMemes', 'OTMemes', 'MarvelMemes', 'DCmemes',
  'dndmemes', 'rpgmemes', 'dnd', 'DnD', 'pathfinder', 'criticalrole',
  
  // SOCIAL MEDIA & INTERNET CULTURE
  'TikTokCringe', 'CringeTikToks', 'ImTheMainCharacter', 'niceguys', 'Nicegirls',
  'ShitAmericansSay', 'confidentlyincorrect', 'PeterExplainsTheJoke', 'ExplainTheJoke',
  'HumorInPoorTaste', 'whenthe', 'nextfuckinglevel', 'BeAmazed', 'blackmagicfuckery',
  'oddlysatisfying', 'mildlyinfuriating', 'mildlyinteresting', 'interestingasfuck',
  
  // SCIENCE & EDUCATION (Funny)
  'science', 'askscience', 'explainlikeimfive', 'todayilearned', 'mildlyinfuriating',
  'LifeProTips', 'Showerthoughts', 'unpopularopinion', 'changemyview',
  'AmItheAsshole', 'relationship_advice', 'tifu', 'maliciouscompliance',
  
  // FOOD & COOKING HUMOR
  'food', 'cooking', 'shittyfoodporn', 'foodporn', 'WeWantPlates', 'deliciouscompliance',
  'KitchenConfidential', 'AskCulinary', 'breadit', 'pizza', 'burgers',
  
  // SPORTS & FITNESS HUMOR
  'sports', 'nba', 'nfl', 'soccer', 'hockey', 'baseball', 'tennis', 'golf',
  'fitness', 'bodybuilding', 'running', 'cycling', 'swimming', 'climbing',
  
  // MUSIC & ART HUMOR
  'music', 'listentothis', 'Music', 'hiphopheads', 'popheads', 'indieheads',
  'electronicmusic', 'jazz', 'classicalmusic', 'Art', 'drawing', 'painting',
  'photography', 'digitalart', 'conceptart', 'comics', 'webcomics',
  
  // BOOKS & WRITING HUMOR
  'books', 'writing', 'fantasy', 'scifi', 'horror', 'mystery', 'romance',
  'bookclub', 'suggestmeabook', 'whatsthatbook', 'bookporn', 'bookmemes',
  
  // TRAVEL & LIFESTYLE HUMOR
  'travel', 'solotravel', 'backpacking', 'digitalnomad', 'expats', 'IWantOut',
  'personalfinance', 'investing', 'cryptocurrency', 'bitcoin', 'ethereum',
  'Frugal', 'BuyItForLife', 'BIFL', 'minimalism', 'simpleliving',
  
  // NEWS & POLITICS (Humor)
  'news', 'worldnews', 'politics', 'PoliticalHumor', 'PoliticalCompassMemes',
  'WhitePeopleTwitter', 'BlackPeopleTwitter', 'AsianPeopleTwitter', 'latino',
  
  // RANDOM & MISCELLANEOUS
  'AskReddit', 'mildlyinfuriating', 'oddlysatisfying', 'interestingasfuck',
  'Damnthatsinteresting', 'nextfuckinglevel', 'BeAmazed', 'blackmagicfuckery',
  'unexpected', 'perfectlycutscreams', 'ContagiousLaughter', 'funnyvideos'
];

async function addSubredditsToCampaigns() {
  try {
    console.log('🚀 Adding 100+ subreddits to campaigns...');
    
    // Get existing campaigns
    const existingCampaigns = await prisma.campaign.findMany({
      select: { id: true, name: true, subreddits: true }
    });
    
    console.log(`Found ${existingCampaigns.length} existing campaigns`);
    
    // Create new campaigns for different categories
    const newCampaigns = [
      {
        name: 'Humor & Memes Collection',
        subreddits: subreddits.slice(0, 25), // First 25
        enabled: true,
        autoFetch: true,
        autoProcess: true,
        autoPublish: true
      },
      {
        name: 'Entertainment & Gaming',
        subreddits: subreddits.slice(25, 50), // Next 25
        enabled: true,
        autoFetch: true,
        autoProcess: true,
        autoPublish: true
      },
      {
        name: 'Animals & Pets Collection',
        subreddits: subreddits.slice(50, 75), // Next 25
        enabled: true,
        autoFetch: true,
        autoProcess: true,
        autoPublish: true
      },
      {
        name: 'Tech & Science Humor',
        subreddits: subreddits.slice(75, 100), // Next 25
        enabled: true,
        autoFetch: true,
        autoProcess: true,
        autoPublish: true
      },
      {
        name: 'Random Entertainment',
        subreddits: subreddits.slice(100), // Remaining
        enabled: true,
        autoFetch: true,
        autoProcess: true,
        autoPublish: true
      }
    ];
    
    // Add new campaigns
    for (const campaign of newCampaigns) {
      const created = await prisma.campaign.create({
        data: {
          name: campaign.name,
          subreddits: JSON.stringify(campaign.subreddits),
          enabled: campaign.enabled,
          autoFetch: campaign.autoFetch,
          autoProcess: campaign.autoProcess,
          autoPublish: campaign.autoPublish,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Created campaign: ${created.name} with ${campaign.subreddits.length} subreddits`);
    }
    
    console.log(`\n🎉 Successfully added ${subreddits.length} subreddits across ${newCampaigns.length} campaigns!`);
    console.log('\n📊 Campaign Summary:');
    newCampaigns.forEach(campaign => {
      console.log(`  - ${campaign.name}: ${campaign.subreddits.length} subreddits`);
    });
    
  } catch (error) {
    console.error('❌ Error adding subreddits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSubredditsToCampaigns();
