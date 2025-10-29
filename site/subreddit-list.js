// Quick script to add subreddits via API call
const subreddits = [
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

console.log('📝 Subreddits to add:', subreddits.length);
console.log('🎯 First 10:', subreddits.slice(0, 10));
console.log('✅ Script ready - run manually if needed');
