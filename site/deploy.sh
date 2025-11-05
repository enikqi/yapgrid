#!/bin/bash
cd /home/ubuntu/apps/yapgrid/site
echo "Building..."
npm run build
echo "Restarting PM2..."
pm2 restart yapgrid-nextjs
echo "Restarting scheduler..."
pkill -f background-scheduler
sleep 2
node background-scheduler.js > /tmp/scheduler.log 2>&1 &
echo "Done! Check status with: pm2 status && ps aux | grep background-scheduler | grep -v grep"

