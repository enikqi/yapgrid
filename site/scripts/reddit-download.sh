#!/bin/bash

# Set the Reddit URL
REDDIT_URL="https://v.redd.it/8n3sx9sib2wf1"
OUTPUT_FILE="reddit_video.mp4"

# Create temp directory if it doesn't exist
mkdir -p temp

# Download the video using curl with a user agent
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
     -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" \
     -H "Accept-Language: en-US,en;q=0.5" \
     -H "Connection: keep-alive" \
     -H "Upgrade-Insecure-Requests: 1" \
     -L "$REDDIT_URL" -o "temp/$OUTPUT_FILE"

# Check if download was successful
if [ $? -eq 0 ]; then
    echo "Video downloaded successfully to temp/$OUTPUT_FILE"
    ls -lh "temp/$OUTPUT_FILE"
else
    echo "Failed to download the video"
fi
