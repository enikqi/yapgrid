import 'server-only'
import { Builder, By, until, WebDriver } from 'selenium-webdriver'
import * as chrome from 'selenium-webdriver/chrome'
import * as path from 'path'
import * as fs from 'fs'

export interface PinterestBoard {
  id: string
  name: string
  description: string
  pinCount: number
  followerCount: number
}

export interface PinterestPinData {
  title: string
  description: string
  imagePath: string
  boardName: string
  link?: string
}

export class PinterestAutomation {
  private driver: WebDriver | null = null
  private userDataDir: string

  constructor(userDataDir?: string) {
    // Use provided user data dir or create a default one
    this.userDataDir = userDataDir || path.join(process.cwd(), 'chrome-user-data')
    
    // Ensure the directory exists
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true })
    }
  }

  async initialize(): Promise<void> {
    try {
      const options = new chrome.Options()
      
      // Use persistent user data directory
      options.addArguments(`--user-data-dir=${this.userDataDir}`)
      
      // Additional Chrome options for better compatibility
      options.addArguments('--no-sandbox')
      options.addArguments('--disable-dev-shm-usage')
      options.addArguments('--disable-blink-features=AutomationControlled')
      options.addArguments('--disable-extensions')
      options.addArguments('--disable-plugins')
      options.addArguments('--disable-images') // Faster loading
      
      // Remove automation indicators
      options.excludeSwitches('enable-automation')
      options.addArguments('--disable-blink-features=AutomationControlled')
      
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build()

      console.log('Pinterest automation initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Pinterest automation:', error)
      throw error
    }
  }

  async loginToPinterest(): Promise<boolean> {
    if (!this.driver) {
      throw new Error('Driver not initialized')
    }

    try {
      console.log('Navigating to Pinterest...')
      await this.driver.get('https://www.pinterest.com/login/')
      
      // Wait for page to load
      await this.driver.wait(until.titleContains('Pinterest'), 10000)
      
      // Check if already logged in by looking for profile elements
      try {
        await this.driver.wait(until.elementLocated(By.css('[data-test-id="header-profile"]')), 5000)
        console.log('Already logged in to Pinterest')
        return true
      } catch {
        console.log('Not logged in, please log in manually...')
        console.log('Press Enter after logging in to continue...')
        
        // Wait for user to log in manually
        await this.waitForUserInput()
        
        // Check if login was successful
        try {
          await this.driver.wait(until.elementLocated(By.css('[data-test-id="header-profile"]')), 10000)
          console.log('Login successful!')
          return true
        } catch {
          console.log('Login failed or timed out')
          return false
        }
      }
    } catch (error) {
      console.error('Error during Pinterest login:', error)
      return false
    }
  }

  async fetchBoards(): Promise<PinterestBoard[]> {
    if (!this.driver) {
      throw new Error('Driver not initialized')
    }

    try {
      console.log('Fetching Pinterest boards...')
      
      // Navigate to profile page
      await this.driver.get('https://www.pinterest.com/')
      await this.driver.wait(until.titleContains('Pinterest'), 10000)
      
      // Click on profile to access boards
      try {
        const profileButton = await this.driver.wait(
          until.elementLocated(By.css('[data-test-id="header-profile"]')),
          10000
        )
        await profileButton.click()
        
        // Wait for profile page to load
        await this.driver.wait(until.urlContains('/profile/'), 10000)
      } catch (error) {
        console.log('Could not access profile, trying direct boards URL...')
        await this.driver.get('https://www.pinterest.com/boards/')
        await this.driver.wait(until.titleContains('Pinterest'), 10000)
      }

      // Wait for boards to load and extract board information
      await this.driver.wait(until.elementLocated(By.css('[data-test-id="board-card"]')), 15000)
      
      const boardElements = await this.driver.findElements(By.css('[data-test-id="board-card"]'))
      const boards: PinterestBoard[] = []

      for (const boardElement of boardElements) {
        try {
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
        } catch (error) {
          console.log('Error extracting board info:', error)
        }
      }

      console.log(`Found ${boards.length} boards`)
      return boards
    } catch (error) {
      console.error('Error fetching Pinterest boards:', error)
      return []
    }
  }

  async createPin(pinData: PinterestPinData): Promise<boolean> {
    if (!this.driver) {
      throw new Error('Driver not initialized')
    }

    try {
      console.log(`Creating pin: ${pinData.title}`)
      
      // Navigate to create pin page
      await this.driver.get('https://www.pinterest.com/pin-builder/')
      await this.driver.wait(until.titleContains('Pinterest'), 10000)
      
      // Wait for the create pin form to load
      await this.driver.wait(until.elementLocated(By.css('[data-test-id="pin-builder"]')), 15000)
      
      // Upload image
      const fileInput = await this.driver.findElement(By.css('input[type="file"]'))
      await fileInput.sendKeys(pinData.imagePath)
      
      // Wait for image to upload
      await this.driver.wait(until.elementLocated(By.css('[data-test-id="pin-builder-title"]')), 10000)
      
      // Fill in title
      const titleInput = await this.driver.findElement(By.css('[data-test-id="pin-builder-title"]'))
      await titleInput.clear()
      await titleInput.sendKeys(pinData.title)
      
      // Fill in description
      const descriptionInput = await this.driver.findElement(By.css('[data-test-id="pin-builder-description"]'))
      await descriptionInput.clear()
      await descriptionInput.sendKeys(pinData.description)
      
      // Select board
      const boardSelect = await this.driver.findElement(By.css('[data-test-id="pin-builder-board-select"]'))
      await boardSelect.click()
      
      // Find and select the specified board
      const boardOption = await this.driver.wait(
        until.elementLocated(By.xpath(`//div[contains(text(), "${pinData.boardName}")]`)),
        5000
      )
      await boardOption.click()
      
      // Add destination link if provided
      if (pinData.link) {
        const linkInput = await this.driver.findElement(By.css('[data-test-id="pin-builder-link"]'))
        await linkInput.clear()
        await linkInput.sendKeys(pinData.link)
      }
      
      // Save pin (but don't publish yet)
      const saveButton = await this.driver.findElement(By.css('[data-test-id="pin-builder-save"]'))
      await saveButton.click()
      
      console.log('Pin created successfully (saved as draft)')
      return true
    } catch (error) {
      console.error('Error creating Pinterest pin:', error)
      return false
    }
  }

  async publishPin(): Promise<boolean> {
    if (!this.driver) {
      throw new Error('Driver not initialized')
    }

    try {
      console.log('Publishing pin...')
      
      // Find and click the publish button
      const publishButton = await this.driver.wait(
        until.elementLocated(By.css('[data-test-id="pin-builder-publish"]')),
        10000
      )
      await publishButton.click()
      
      // Wait for confirmation
      await this.driver.wait(until.elementLocated(By.css('[data-test-id="pin-published"]')), 10000)
      
      console.log('Pin published successfully!')
      return true
    } catch (error) {
      console.error('Error publishing Pinterest pin:', error)
      return false
    }
  }

  private async waitForUserInput(): Promise<void> {
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve()
      })
    })
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.quit()
      this.driver = null
      console.log('Pinterest automation closed')
    }
  }
}

export default PinterestAutomation
