const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const path = require('path')
const fs = require('fs')

async function openPinterestLogin() {
  console.log('🚀 Opening Pinterest Login...\n')
  
  let driver = null
  
  try {
    // Set up Chrome options
    const options = new chrome.Options()
    
    // Create user data directory for persistent session
    const userDataDir = path.join(__dirname, 'chrome-user-data')
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true })
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

    console.log('🌐 Navigating to Pinterest login page...')
    await driver.get('https://www.pinterest.com/login/')
    
    // Wait for page to load
    await driver.wait(until.titleContains('Pinterest'), 10000)
    
    console.log('✅ Pinterest login page opened!')
    console.log('👤 Please log in manually in the browser window...')
    console.log('💾 Your login session will be saved for future use')
    console.log('\n⏰ Browser will stay open for 5 minutes...')
    console.log('🔄 After logging in, you can close the browser manually')
    
    // Check if already logged in
    try {
      await driver.wait(until.elementLocated(By.css('[data-test-id="header-profile"]')), 3000)
      console.log('✅ Already logged in to Pinterest!')
    } catch {
      console.log('🔐 Please log in to Pinterest...')
    }
    
    // Keep browser open for 5 minutes
    await new Promise(resolve => setTimeout(resolve, 300000))
    
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
openPinterestLogin().catch(console.error)
