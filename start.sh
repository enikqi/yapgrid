#!/bin/bash

cd /home/ubuntu/apps/yapgrid/site

# Stop any existing processes
pm2 delete all 2>/dev/null || true
pkill -9 node 2>/dev/null || true
sleep 2

# Build Next.js
echo "🔨 Building Next.js application..."
npm run build

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ Application started!"
pm2 status


