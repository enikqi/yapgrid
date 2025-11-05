# 🔧 Fix Google Sign In - 400 Error

## ⚠️ Problem:
Getting "400. That's an error. The server cannot process the request because it is malformed."

This means your Google OAuth is not configured correctly.

---

## ✅ Solution: Configure Google OAuth (5 minutes)

### Step 1: **Create Google OAuth Credentials**

1. Go to **Google Cloud Console**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Create Project** (if you don't have one):
   - Click "Select a project" → "New Project"
   - Name: "YapGrid"
   - Click "Create"

3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Enable APIs and Services"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "YapGrid Web Client"

5. **Add Authorized Redirect URIs**:
   ```
   https://yapgrid.com/api/auth/callback/google
   http://localhost:3002/api/auth/callback/google
   ```
   
   ⚠️ **IMPORTANT**: Make sure you add BOTH URLs!

6. **Copy Credentials**:
   - Copy the "Client ID" (looks like: 123456789-abc...xyz.apps.googleusercontent.com)
   - Copy the "Client Secret" (looks like: GOCSPX-abc123...)

---

### Step 2: **Add to Environment Variables**

1. **Edit .env.production.local**:
   ```bash
   cd /home/ubuntu/apps/yapgrid/site
   nano .env.production.local
   ```

2. **Add these lines**:
   ```bash
   # Google OAuth
   GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
   
   # NextAuth URL (MUST be set correctly)
   NEXTAUTH_URL=https://yapgrid.com
   NEXTAUTH_SECRET=your-random-secret-key-here
   ```

3. **Generate a random NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```
   Paste the output as your NEXTAUTH_SECRET

4. **Save and exit**: Ctrl+X, then Y, then Enter

---

### Step 3: **Restart Server**

```bash
pm2 restart yapgrid-nextjs
```

---

## 📝 Quick Fix Command:

Run these commands to set it up quickly:

```bash
# 1. Edit environment file
cd /home/ubuntu/apps/yapgrid/site
nano .env.production.local

# 2. Add these lines (replace with your actual values):
echo 'GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE' >> .env.production.local
echo 'GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE' >> .env.production.local
echo 'NEXTAUTH_URL=https://yapgrid.com' >> .env.production.local
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.production.local

# 3. Restart
pm2 restart yapgrid-nextjs
```

---

## 🎯 Common Issues & Fixes:

### Issue 1: "redirect_uri_mismatch"
**Solution**: Make sure the redirect URI in Google Cloud Console EXACTLY matches:
```
https://yapgrid.com/api/auth/callback/google
```

### Issue 2: "invalid_client"
**Solution**: Double-check your Client ID and Client Secret are correct

### Issue 3: Still getting 400 error
**Solution**: 
1. Clear browser cookies
2. Make sure NEXTAUTH_URL is set to `https://yapgrid.com` (without trailing slash)
3. Restart PM2: `pm2 restart yapgrid-nextjs`

---

## 🔍 Test It:

After setup, test by:
1. Go to https://yapgrid.com/auth/signin
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login, redirects back to yapgrid.com

---

## 📋 Checklist:

- [ ] Created Google Cloud Project
- [ ] Enabled Google+ API
- [ ] Created OAuth Client ID
- [ ] Added redirect URI: `https://yapgrid.com/api/auth/callback/google`
- [ ] Copied Client ID and Secret
- [ ] Added to `.env.production.local`
- [ ] Set NEXTAUTH_URL to `https://yapgrid.com`
- [ ] Generated NEXTAUTH_SECRET
- [ ] Restarted PM2

---

Need help? Send me your Google Client ID (it's safe to share, it's public anyway) and I can help verify the setup!

