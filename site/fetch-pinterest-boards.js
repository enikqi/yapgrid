const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const path = require('path')
const fs = require('fs')

async function fetchPinterestBoards() {
  console.log('🚀 Fetching Pinterest Boards...\n')
  
  let driver = null
  
  try {
    // Set up Chrome options
    const options = new chrome.Options()
    
    // Use the same user data directory as login script
    const userDataDir = path.join(__dirname, 'chrome-user-data')
    
    if (!fs.existsSync(userDataDir)) {
      console.log('❌ Chrome user data directory not found!')
      console.log('💡 Please run "node open-pinterest-login.js" first to log in')
      return
    }
    
    options.addArguments(`--user-data-dir=${userDataDir}`)
    options.addArguments('--no-sandbox')
    options.addArguments('--disable-dev-shm-usage')
    options.addArguments('--disable-blink-features=AutomationControlled')
    options.addArguments('--disable-extensions')
    options.addArguments('--disable-plugins')
    
    // Remove automation indicators
    options.excludeSwitches('enable-automation')
    options.addArguments('--disable-blink-features=AutomationControlled')
    
    console.log('📱 Initializing Chrome browser...')
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build()

    console.log('🌐 Navigating to Pinterest...')
    await driver.get('https://www.pinterest.com/')
    
    // Wait for page to load
    await driver.wait(until.titleContains('Pinterest'), 10000)
    
    // Check if logged in
    try {
      await driver.wait(until.elementLocated(By.css('[data-test-id="header-profile"]')), 5000)
      console.log('✅ Successfully logged in to Pinterest!')
    } catch {
      console.log('❌ Not logged in! Please run "node open-pinterest-login.js" first')
      return
    }
    
    console.log('📋 Fetching Pinterest boards...')
    
    // Navigate to profile/boards page
    try {
      const profileButton = await driver.wait(
        until.elementLocated(By.css('[data-test-id="header-profile"]')),
        10000
      )
      await profileButton.click()
      
      // Wait for profile page to load
      await driver.wait(until.urlContains('/profile/'), 10000)
    } catch (error) {
      console.log('🔄 Trying direct boards URL...')
      await driver.get('https://www.pinterest.com/boards/')
      await driver.wait(until.titleContains('Pinterest'), 10000)
    }

    // Wait for boards to load
    try {
      await driver.wait(until.elementLocated(By.css('[data-test-id="board-card"]')), 15000)
    } catch (error) {
      console.log('❌ No boards found or page not loaded properly')
      return
    }
    
    // Extract board information
    const boardElements = await driver.findElements(By.css('[data-test-id="board-card"]'))
    const boards = []

    console.log(`\n📊 Found ${boardElements.length} boards:`)
    
    for (let i = 0; i < boardElements.length; i++) {
      try {
        const boardElement = boardElements[i]
        const nameElement = await boardElement.findElement(By.css('[data-test-id="board-name"]'))
        const name = await nameElement.getText()
        
        // Try to get pin count
        let pinCount = 0
        try {
          const pinCountElement = await boardElement.findElement(By.css('[data-test-id="board-pin-count"]'))
          const pinCountText = await pinCountElement.getText()
          pinCount = parseInt(pinCountText.replace(/[^\d]/g, '')) || 0
        } catch {
          // Pin count not available
        }

        // Try to get follower count
        let followerCount = 0
        try {
          const followerElement = await boardElement.findElement(By.css('[data-test-id="board-follower-count"]'))
          const followerText = await followerElement.getText()
          followerCount = parseInt(followerText.replace(/[^\d]/g, '')) || 0
        } catch {
          // Follower count not available
        }

        boards.push({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name: name,
          description: '',
          pinCount: pinCount,
          followerCount: followerCount
        })
        
        console.log(`   ${i + 1}. ${name}`)
        console.log(`      📌 Pins: ${pinCount}, 👥 Followers: ${followerCount}`)
      } catch (error) {
        console.log(`   ❌ Error extracting board ${i + 1}:`, error.message)
      }
    }

    console.log(`\n✅ Successfully fetched ${boards.length} Pinterest boards!`)
    console.log('💾 Board data:', JSON.stringify(boards, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (driver) {
      console.log('\n🔒 Closing browser...')
      await driver.quit()
      console.log('✅ Browser closed')
    }
  }
}

// Run the function
fetchPinterestBoards().catch(console.error)
