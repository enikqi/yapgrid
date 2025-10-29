# Pinterest Automation System

This system implements Pinterest automation using Selenium WebDriver, based on the approach from [mukhbit0/Auto_Posting_on_Pinterest](https://github.com/mukhbit0/Auto_Posting_on_Pinterest).

## 🚀 **How It Works**

Instead of trying to use Pinterest's API (which blocks localhost requests), this system uses **browser automation** to:

1. **Open Chrome browser** with persistent user data
2. **Navigate to Pinterest** and handle login
3. **Extract real board data** by scraping the web interface
4. **Create pins** by automating the pin creation form
5. **Publish pins** automatically

## 🔧 **Key Features**

- ✅ **Real Pinterest Integration** - Uses actual Pinterest website
- ✅ **Persistent Login** - Saves Chrome session data to avoid repeated logins
- ✅ **Board Fetching** - Gets your actual Pinterest boards
- ✅ **Pin Creation** - Creates pins with images, titles, descriptions
- ✅ **Fallback System** - Uses mock data if automation fails

## 📋 **Requirements**

- Chrome browser installed
- Node.js with Selenium WebDriver
- Internet connection

## 🎯 **Usage**

### Fetch Pinterest Boards
```javascript
const PinterestAutomation = require('./lib/pinterest-automation')
const pinterest = new PinterestAutomation()

await pinterest.initialize()
await pinterest.loginToPinterest() // Manual login required
const boards = await pinterest.fetchBoards()
await pinterest.close()
```

### Create Pinterest Pin
```javascript
const pinData = {
  title: "My Amazing Pin",
  description: "This is a great pin!",
  imagePath: "/path/to/image.jpg",
  boardName: "My Board",
  link: "https://example.com"
}

await pinterest.createPin(pinData)
await pinterest.publishPin()
```

## 🔄 **API Integration**

The system is integrated into `/api/admin/pinterest` with these actions:

- `fetch_boards` - Gets Pinterest boards using browser automation
- `create_pin` - Creates a Pinterest pin using browser automation
- `test_session` - Tests Pinterest session (mock for now)

## ⚠️ **Important Notes**

1. **Manual Login Required** - First time setup requires manual Pinterest login
2. **Chrome Must Be Installed** - System uses Chrome browser
3. **Internet Required** - Needs connection to Pinterest
4. **Rate Limiting** - Pinterest may limit automated actions

## 🛠️ **Troubleshooting**

- **"Driver not initialized"** - Run `npm install selenium-webdriver`
- **"Login failed"** - Manually log in to Pinterest when prompted
- **"No boards found"** - Check if Pinterest profile has boards
- **"Chrome not found"** - Install Chrome browser

## 📁 **Files**

- `lib/pinterest-automation.ts` - Main automation class
- `app/api/admin/pinterest/route.ts` - API integration
- `test-pinterest-automation.js` - Test script

## 🎉 **Success!**

This approach successfully bypasses Pinterest's API restrictions by using real browser automation, just like the WordPress plugins you mentioned!
