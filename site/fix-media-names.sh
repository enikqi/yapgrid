#!/bin/bash

# Script to remove timestamp prefix from uploaded media files
# Files like "1761480289708_cmglcbjab0033vjy40qhd9ukb_1760130939456.jpg"
# Will become: "cmglcbjab0033vjy40qhd9ukb_1760130939456.jpg"

cd /home/ubuntu/apps/yapgrid/site/media

echo "🔄 Removing timestamp prefixes from media files..."
echo ""

count=0

for file in *; do
    # Check if file exists and is a regular file
    if [ -f "$file" ]; then
        # Check if filename starts with timestamp pattern (numbers followed by underscore)
        if [[ "$file" =~ ^[0-9]+_(.+) ]]; then
            # Extract the part after the timestamp
            new_name="${BASH_REMATCH[1]}"
            
            # Only rename if the new name is different
            if [ "$file" != "$new_name" ]; then
                mv "$file" "$new_name"
                echo "✅ Renamed: $file → $new_name"
                ((count++))
            fi
        fi
    fi
done

echo ""
echo "✅ Done! Renamed $count files."
