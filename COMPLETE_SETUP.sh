#!/bin/bash

echo "================================================"
echo "🎯 YAPGRID COMPLETE SETUP & DEPLOYMENT"
echo "================================================"
echo ""
echo "This will:"
echo "  1. Deploy new design (gallery carousel + modern cards)"
echo "  2. Restart all services"
echo "  3. Fetch new posts from Reddit"
echo "  4. Show system status"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Step 1: Deploy
echo ""
echo "================================================"
echo "📦 STEP 1: DEPLOYING NEW VERSION"
echo "================================================"

cd /home/ubuntu/apps/yapgrid
chmod +x DEPLOY_NOW.sh
./DEPLOY_NOW.sh

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

# Step 2: Wait for services to stabilize
echo ""
echo "⏳ Waiting 10 seconds for services to stabilize..."
sleep 10

# Step 3: Force fetch new posts
echo ""
echo "================================================"
echo "📥 STEP 2: FETCHING NEW POSTS"
echo "================================================"

chmod +x FORCE_FETCH_POSTS.sh
./FORCE_FETCH_POSTS.sh

# Step 4: Check gallery posts
echo ""
echo "================================================"
echo "🖼️  STEP 3: CHECKING GALLERY POSTS"
echo "================================================"

chmod +x CHECK_GALLERY.sh
./CHECK_GALLERY.sh

# Step 5: Final status
echo ""
echo "================================================"
echo "📊 FINAL SYSTEM STATUS"
echo "================================================"

echo ""
echo "PM2:"
pm2 status

echo ""
echo "Scheduler:"
ps aux | grep "background-scheduler" | grep -v grep || echo "❌ Not running!"

echo ""
echo "Recent Scheduler Logs (last 20 lines):"
tail -n 20 /tmp/scheduler.log

echo ""
echo "================================================"
echo "✅ SETUP COMPLETE!"
echo "================================================"
echo ""
echo "🌐 Website: https://yapgrid.com"
echo "🎨 Expected: Modern cards with gallery carousels"
echo ""
echo "📊 Monitoring Commands:"
echo "  - tail -f /tmp/scheduler.log"
echo "  - pm2 logs yapgrid-nextjs"
echo "  - pm2 status"
echo ""
echo "🔄 To fetch more posts:"
echo "  ./FORCE_FETCH_POSTS.sh"
echo ""

