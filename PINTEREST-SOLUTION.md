# Pinterest Posting Solution

## ⚠️ Important Discovery

Pinterest **does not** officially support posting via session cookies through their API. They require OAuth access tokens.

## ✅ Working Solutions:

### Option 1: **Use Pinterest API Access Token** (Recommended - Fast & Official)

This is the official, supported way:

1. **Go to Pinterest Developers**: https://developers.pinterest.com/
2. **Create an app** (if you don't have one)
3. **Generate Access Token**:
   - Go to your app settings
   - Click "Generate Token"
   - Select scopes: `pins:read`, `pins:write`, `boards:read`, `boards:write`
   - Copy the access token

4. **Add to your environment**:
   ```bash
   # Edit .env.production.local
   PINTEREST_ACCESS_TOKEN=your_token_here
   PINTEREST_DEFAULT_BOARD_ID=your_board_id
   ```

5. **Restart server**:
   ```bash
   pm2 restart yapgrid-nextjs
   ```

**Advantages**:
- ✅ Official Pinterest API
- ✅ Fast (1-3 seconds per post)
- ✅ Reliable
- ✅ No session expiration issues

**Your existing code already supports this!** Just need the token.

---

### Option 2: **Pinterest Business API** (For scale)

If you have a Pinterest Business account:

1. Apply for API access at https://developers.pinterest.com/
2. Get approved (usually takes 1-2 days)
3. Use the same token method as Option 1

---

### Option 3: **Browser Extension Posting** (Manual but works)

For immediate use without API:

1. Install a Pinterest browser extension
2. YapGrid generates the content (title, description, image URL)
3. You manually post using the extension

---

## 🚀 Quick Start (Option 1):

1. Get your Pinterest Access Token:
   ```
   https://developers.pinterest.com/apps/
   ```

2. Set environment variable:
   ```bash
   cd /home/ubuntu/apps/yapgrid/site
   echo 'PINTEREST_ACCESS_TOKEN=pina_YOUR_TOKEN_HERE' >> .env.production.local
   ```

3. Restart:
   ```bash
   pm2 restart yapgrid-nextjs
   ```

4. Go to admin panel and create Pinterest campaign!

---

## 📝 How to Get Pinterest Access Token (Step by Step):

1. Visit: https://developers.pinterest.com/
2. Sign in with your Pinterest account
3. Click "My Apps" → "Create App"
4. Fill in:
   - App name: "YapGrid Automation"
   - Description: "Social media content posting"
   - Privacy Policy: https://yapgrid.com/privacy
5. Once created, go to app settings
6. Under "Access Token", click "Generate"
7. Select scopes:
   - ✅ pins:read
   - ✅ pins:write  
   - ✅ boards:read
   - ✅ boards:write
8. Click "Generate Token"
9. **Copy the token** (starts with `pina_`)
10. Save it to your `.env.production.local` file

Done! Now you can post to Pinterest officially! 🎉

