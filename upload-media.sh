#!/bin/bash

# YapGrid Media Upload Script
# This script helps upload media files from Windows desktop to the server

echo "🎯 YapGrid Media Upload Helper"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "/home/ubuntu/apps/yapgrid/site/media" ]; then
    echo "❌ Error: Media directory not found. Please run this from the yapgrid directory."
    exit 1
fi

echo "📁 Media directory created:"
echo "   - /home/ubuntu/apps/yapgrid/site/media/"
echo ""

echo "🌐 Upload Options:"
echo ""
echo "1. 📤 Web Upload (Recommended)"
echo "   - Go to: https://yapgrid.com/upload"
echo "   - Drag & drop files from your desktop"
echo "   - Files will be automatically organized"
echo ""

echo "2. 🔧 SCP Command (Advanced)"
echo "   Run this command from your Windows computer:"
echo ""
echo "   scp -r C:\\Users\\Admin\\Desktop\\pin_reddit\\media\\* ubuntu@yapgrid.com:/home/ubuntu/apps/yapgrid/site/media/"
echo ""

echo "3. 📋 Manual Upload Steps:"
echo "   a) Open https://yapgrid.com/upload in your browser"
echo "   b) Drag files from C:\\Users\\Admin\\Desktop\\pin_reddit\\media\\"
echo "   c) Drop them in the upload area"
echo "   d) Copy the generated URLs for your posts"
echo ""

echo "📊 Current Media Status:"
echo "========================"

# Count files in media directory
TOTAL_COUNT=$(find /home/ubuntu/apps/yapgrid/site/media -type f 2>/dev/null | wc -l)

echo "   Total files: $TOTAL_COUNT files"
echo ""

echo "🔗 Access URLs:"
echo "   - Upload Page: https://yapgrid.com/upload"
echo "   - Media Files: https://yapgrid.com/media/"
echo ""

echo "✅ Ready for upload! Use the web interface at https://yapgrid.com/upload"
