const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  'SequelMemes', 'OTMemes', 'MarvelMemes', 'DCmemes', 'dndmemes', 'rpgmemes',
  'science', 'askscience', 'explainlikeimfive', 'todayilearned', 'LifeProTips',
  'Showerthoughts', 'unpopularopinion', 'changemyview', 'AmItheAsshole',
  'relationship_advice', 'tifu', 'maliciouscompliance', 'food', 'cooking',
  'shittyfoodporn', 'foodporn', 'WeWantPlates', 'deliciouscompliance',
  'sports', 'nba', 'nfl', 'soccer', 'hockey', 'baseball', 'tennis', 'golf',
  'music', 'listentothis', 'Music', 'hiphopheads', 'popheads', 'indieheads',
  'electronicmusic', 'jazz', 'classicalmusic', 'Art', 'drawing', 'painting',
  'photography', 'digitalart', 'conceptart', 'comics', 'webcomics',
  'books', 'writing', 'fantasy', 'scifi', 'horror', 'mystery', 'romance',
  'travel', 'solotravel', 'backpacking', 'digitalnomad', 'expats', 'IWantOut',
  'personalfinance', 'investing', 'cryptocurrency', 'bitcoin', 'ethereum',
  'news', 'worldnews', 'politics', 'PoliticalHumor', 'PoliticalCompassMemes',
  'WhitePeopleTwitter', 'BlackPeopleTwitter', 'AsianPeopleTwitter', 'latino',
  'AskReddit', 'mildlyinfuriating', 'oddlysatisfying', 'interestingasfuck',
  'Damnthatsinteresting', 'nextfuckinglevel', 'BeAmazed', 'blackmagicfuckery'
];

async function addSubreddits() {
  try {
    console.log('🚀 Adding 100+ subreddits...');
    
    const campaign = await prisma.campaign.findFirst({ where: { enabled: true } });
    if (!campaign) { console.log('❌ No campaigns'); return; }
    
    const existing = JSON.parse(campaign.subreddits || '[]');
    const all = [...new Set([...existing, ...newSubreddits])];
    const added = all.length - existing.length;
    
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { subreddits: JSON.stringify(all), updatedAt: new Date() }
    });
    
    console.log(`✅ Added ${added} subreddits! Total: ${all.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addSubreddits();
