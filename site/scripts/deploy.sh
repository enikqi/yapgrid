#!/bin/bash

# PinReddit Deployment Script

set -e

echo "🚀 Starting PinReddit deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Build the application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:push

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs media temp

# Set proper permissions
chmod -R 755 media
chmod -R 755 temp
chmod -R 755 logs

# Restart applications with PM2
echo "🔄 Restarting applications..."
pm2 restart ecosystem.config.js --update-env

# Show status
echo "✅ Deployment complete!"
pm2 status

echo "📊 Logs available at:"
echo "  - Web: pm2 logs pinreddit-web"
echo "  - Worker: pm2 logs pinreddit-worker"
