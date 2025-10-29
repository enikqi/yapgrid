#!/bin/bash

# Script to fix MP4 videos for Safari iOS compatibility
# Moves moov atom to beginning for fast start

MEDIA_DIR="/home/ubuntu/apps/yapgrid/site/media"
FIXED_COUNT=0
SKIPPED_COUNT=0
ERROR_COUNT=0

echo "🔧 Fixing videos for Safari iOS compatibility..."
echo "📁 Media directory: $MEDIA_DIR"
echo ""

# Find all MP4 files
find "$MEDIA_DIR" -type f -name "*.mp4" ! -name "*_fixed.mp4" ! -name "*_backup.mp4" | while read -r video_file; do
    filename=$(basename "$video_file")
    echo "Processing: $filename"
    
    # Create backup
    backup_file="${video_file}.backup"
    
    # Check if already has faststart
    if ffprobe "$video_file" 2>&1 | grep -q "major_brand.*isom"; then
        # Try to fix it
        temp_file="${video_file}.tmp.mp4"
        
        if ffmpeg -i "$video_file" -c copy -movflags +faststart "$temp_file" -y > /dev/null 2>&1; then
            # Success - replace original
            mv "$video_file" "$backup_file"
            mv "$temp_file" "$video_file"
            echo "  ✅ Fixed: $filename"
            FIXED_COUNT=$((FIXED_COUNT + 1))
            
            # Remove backup after successful fix
            rm -f "$backup_file"
        else
            echo "  ❌ Error fixing: $filename"
            ERROR_COUNT=$((ERROR_COUNT + 1))
            rm -f "$temp_file"
        fi
    else
        echo "  ⏭️  Skipped: $filename (already optimized)"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    fi
    
    echo ""
done

echo ""
echo "📊 Summary:"
echo "  ✅ Fixed: $FIXED_COUNT"
echo "  ⏭️  Skipped: $SKIPPED_COUNT"
echo "  ❌ Errors: $ERROR_COUNT"
echo ""
echo "🎉 Done!"
