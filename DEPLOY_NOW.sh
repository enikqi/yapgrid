#!/bin/bash

echo "================================================"
echo "🚀 YAPGRID DEPLOYMENT SCRIPT"
echo "================================================"

cd /home/ubuntu/apps/yapgrid/site

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔨 Step 2: Building Next.js..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

echo ""
echo "♻️  Step 3: Restarting PM2..."
pm2 restart yapgrid-nextjs

echo ""
echo "🛑 Step 4: Stopping old scheduler..."
pkill -f "node.*background-scheduler"
sleep 3

echo ""
echo "🚀 Step 5: Starting scheduler..."
cd /home/ubuntu/apps/yapgrid/site
nohup node background-scheduler.js > /tmp/scheduler.log 2>&1 &
SCHEDULER_PID=$!
echo "Scheduler started with PID: $SCHEDULER_PID"

echo ""
echo "⏳ Waiting 5 seconds..."
sleep 5

echo ""
echo "================================================"
echo "📊 CURRENT STATUS:"
echo "================================================"

echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Scheduler Status:"
ps aux | grep "background-scheduler" | grep -v grep || echo "❌ Scheduler not running!"

echo ""
echo "Recent Posts in Database:"
cd /home/ubuntu/apps/yapgrid/site
npx prisma db execute --stdin <<EOF
SELECT id, title, status, 
       (SELECT COUNT(*) FROM "Asset" WHERE "postId" = "Post".id AND type = 'THUMBNAIL') as image_count,
       "createdAt"
FROM "Post" 
ORDER BY "createdAt" DESC 
LIMIT 5;
EOF

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "🌐 Visit: https://yapgrid.com"
echo "📝 Logs: tail -f /tmp/scheduler.log"
echo "📊 PM2 logs: pm2 logs yapgrid-nextjs"
echo ""

