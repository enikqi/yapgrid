import PinterestAutomation from './lib/pinterest-automation'

async function testPinterestAutomation() {
  console.log('Testing Pinterest Automation...\n')
  
  const pinterest = new PinterestAutomation()
  
  try {
    console.log('1. Initializing browser...')
    await pinterest.initialize()
    
    console.log('2. Attempting to login to Pinterest...')
    console.log('   Please log in manually when the browser opens...')
    const loginSuccess = await pinterest.loginToPinterest()
    
    if (loginSuccess) {
      console.log('3. Fetching Pinterest boards...')
      const boards = await pinterest.fetchBoards()
      
      console.log(`\n✅ Success! Found ${boards.length} boards:`)
      boards.forEach((board, index) => {
        console.log(`   ${index + 1}. ${board.name}`)
        console.log(`      Pins: ${board.pinCount}, Followers: ${board.followerCount}`)
      })
    } else {
      console.log('❌ Login failed')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    console.log('\n4. Closing browser...')
    await pinterest.close()
    console.log('✅ Test completed')
  }
}

// Run the test
testPinterestAutomation().catch(console.error)
