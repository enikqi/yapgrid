#!/bin/bash

# Watch and Auto Push Script
# Kjo script kontrollon për ndryshime çdo 5 minuta dhe push-on automatikisht

echo "================================================"
echo "👀 WATCHING FOR CHANGES - Auto Push to GitHub"
echo "================================================"
echo ""
echo "This script will check for changes every 5 minutes"
echo "and automatically push them to GitHub."
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd /home/ubuntu/apps/yapgrid

# Path to auto-push script
AUTO_PUSH_SCRIPT="/home/ubuntu/apps/yapgrid/auto-push-to-github.sh"

# Make sure script is executable
chmod +x "$AUTO_PUSH_SCRIPT"

# Check interval (në sekonda)
CHECK_INTERVAL=300  # 5 minuta

LAST_STATUS=$(git status --porcelain)

while true; do
    CURRENT_STATUS=$(git status --porcelain)
    
    # Kontrolloni nëse ka ndryshime
    if [ "$CURRENT_STATUS" != "$LAST_STATUS" ] && [ -n "$CURRENT_STATUS" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📝 Changes detected!"
        echo "Changes:"
        git status --short
        
        # Prit 30 sekonda për të siguruar që ndryshimet janë të kompletuara
        echo "⏳ Waiting 30 seconds before pushing..."
        sleep 30
        
        # Push automatikisht
        "$AUTO_PUSH_SCRIPT" || echo "⚠️  Push failed, will retry next check"
        
        LAST_STATUS=$(git status --porcelain)
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ No changes detected"
    fi
    
    # Prit para se të kontrollosh përsëri
    sleep $CHECK_INTERVAL
done

