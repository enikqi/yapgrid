#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Stop all PM2 processes
echo "📛 Stopping PM2 processes..."
pm2 stop all || true

# Sync database schema
echo "🔄 Syncing database schema..."
npx prisma db push --accept-data-loss --skip-generate

# Regenerate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Clean build
echo "🧹 Cleaning old build..."
rm -rf .next

# Build application
echo "🔨 Building application..."
npm run build

# Verify BUILD_ID exists
if [ ! -f ".next/BUILD_ID" ]; then
    echo "❌ BUILD_ID not found! Build failed!"
    exit 1
fi

echo "✅ BUILD_ID created successfully"

# Initialize job settings
echo "⚙️ Initializing job settings..."
node scripts/init-job-settings.js

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment complete!"
