# 🚀 DEPLOYMENT & TESTING INSTRUCTIONS

## ⚡ QUICK DEPLOY (Run This First!)

```bash
cd /home/ubuntu/apps/yapgrid
chmod +x DEPLOY_NOW.sh
./DEPLOY_NOW.sh
```

This will:
- ✅ Build the new design (modern post cards + gallery carousel)
- ✅ Restart PM2
- ✅ Restart background scheduler
- ✅ Show current system status

---

## 🖼️ CHECK GALLERY POSTS

After deployment, check if gallery posts exist:

```bash
cd /home/ubuntu/apps/yapgrid
chmod +x CHECK_GALLERY.sh
./CHECK_GALLERY.sh
```

---

## 🧪 TEST REDDIT GALLERY FETCH

Test the specific Philippines gallery post:

```bash
cd /home/ubuntu/apps/yapgrid
chmod +x TEST_REDDIT_GALLERY.sh
./TEST_REDDIT_GALLERY.sh
```

---

## 📊 MONITOR SYSTEM

### Watch Scheduler Logs:
```bash
tail -f /tmp/scheduler.log
```

### Watch PM2 Logs:
```bash
pm2 logs yapgrid-nextjs --lines 50
```

### Check Process Status:
```bash
pm2 status
ps aux | grep background-scheduler | grep -v grep
```

---

## 🔍 WHAT TO EXPECT AFTER DEPLOYMENT:

### ✅ Homepage (https://yapgrid.com):
- **Modern Design**: Rounded corners (`rounded-xl`), shadows, hover effects
- **Compact Header**: Smaller fonts, better spacing
- **Gallery Posts**: Multiple images with carousel (if gallery posts exist)
- **Image Counter**: "1/5", "2/5" badge on gallery posts
- **Navigation**: Left/right arrows on hover for galleries

### ✅ Gallery Post Features:
- Click left/right arrows to navigate images
- Dot indicators at bottom
- Image counter badge (top-right)
- Click image to open in new tab

### ✅ Single Image Posts:
- One image displayed
- Click to open in new tab

### ✅ Video Posts:
- Video player with autoplay
- Same as before

---

## 🐛 TROUBLESHOOTING

### If no new posts are showing:
```bash
# Check scheduler is running
ps aux | grep background-scheduler

# If not running, start it:
cd /home/ubuntu/apps/yapgrid/site
node background-scheduler.js > /tmp/scheduler.log 2>&1 &
```

### If gallery posts don't show carousel:
1. Check if gallery posts exist: `./CHECK_GALLERY.sh`
2. If no gallery posts, manually trigger campaign run
3. Check logs: `tail -f /tmp/scheduler.log`

### If design didn't change:
```bash
# Force rebuild
cd /home/ubuntu/apps/yapgrid/site
npm run build
pm2 restart yapgrid-nextjs
```

### Clear browser cache:
- Press `Ctrl + Shift + R` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

---

## 📝 FILES CHANGED:

1. `/site/components/gallery-carousel.tsx` - New gallery component
2. `/site/components/post-card.tsx` - Updated with modern design + gallery support

---

## 🎯 EXPECTED RESULTS:

### Before:
- Basic post cards
- Single image per post
- No carousel

### After:
- ✨ Modern Reddit-style cards
- 🖼️ Gallery carousel for multi-image posts
- 🎨 Better typography and spacing
- 🎭 Smooth hover effects
- 📱 Responsive design

---

## 🚨 IF TERMINAL IS BROKEN:

Run these commands via SSH directly:

```bash
ssh ubuntu@your-server

# Then run:
cd /home/ubuntu/apps/yapgrid
./DEPLOY_NOW.sh
```

---

**Need help? Check the logs first!**
- Scheduler: `tail -f /tmp/scheduler.log`
- PM2: `pm2 logs yapgrid-nextjs`
- System: `pm2 status`

