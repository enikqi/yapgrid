#!/bin/bash

echo "================================================"
echo "🖼️  FETCHING PHILIPPINES GALLERY POST"
echo "================================================"
echo ""

cd /home/ubuntu/apps/yapgrid/site

# Get the DATABASE_URL from env file
DB_URL=$(grep "^DATABASE_URL=" .env.production.local | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DB_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.production.local"
    exit 1
fi

echo "Step 1: Finding Philippines campaign..."
CAMPAIGN_ID=$(psql "$DB_URL" -t -c "SELECT id FROM \"Campaign\" WHERE LOWER(subreddit) = 'philippines' AND platform = 'REDDIT' ORDER BY \"createdAt\" DESC LIMIT 1;" 2>/dev/null | xargs)

if [ -z "$CAMPAIGN_ID" ]; then
    echo "❌ Philippines campaign not found!"
    echo ""
    echo "To create one:"
    echo "  1. Go to: https://yapgrid.com/admin/campaigns"
    echo "  2. Create New Campaign:"
    echo "     - Platform: Reddit"
    echo "     - Subreddit: Philippines"
    echo "     - Enabled: true"
    exit 1
fi

echo "✅ Found campaign: $CAMPAIGN_ID"
echo ""

echo "Step 2: Triggering manual run..."
RESPONSE=$(curl -s -X POST "http://localhost:3002/api/campaigns/$CAMPAIGN_ID/run" \
    -H "Content-Type: application/json")

echo "Response: $RESPONSE"
echo ""

echo "Step 3: Waiting for processing (30 seconds)..."
sleep 30

echo ""
echo "Step 4: Checking for Philippines posts..."
psql "$DB_URL" -c "
SELECT 
    p.id,
    LEFT(p.title, 60) as title,
    p.status,
    p.url,
    (SELECT COUNT(*) FROM \"Asset\" WHERE \"postId\" = p.id AND type = 'THUMBNAIL') as images
FROM \"Post\" p
WHERE p.subreddit = 'Philippines'
ORDER BY p.\"createdAt\" DESC
LIMIT 10;
" 2>/dev/null

echo ""
echo "Step 5: Checking for gallery posts (multiple images)..."
psql "$DB_URL" -c "
SELECT 
    p.id,
    LEFT(p.title, 60) as title,
    COUNT(a.id) FILTER (WHERE a.type = 'THUMBNAIL') as image_count,
    p.status
FROM \"Post\" p
LEFT JOIN \"Asset\" a ON a.\"postId\" = p.id
WHERE p.subreddit = 'Philippines'
GROUP BY p.id, p.title, p.status
HAVING COUNT(a.id) FILTER (WHERE a.type = 'THUMBNAIL') > 1
ORDER BY p.\"createdAt\" DESC;
" 2>/dev/null

echo ""
echo "================================================"
echo "✅ Done! Check https://yapgrid.com/y/Philippines"
echo "================================================"
echo ""
echo "If no posts appeared yet:"
echo "  - Check scheduler logs: tail -f /tmp/scheduler.log"
echo "  - Posts need to be processed (NEW → READY → PUBLISHED)"
echo "  - Auto-processing runs every 30 seconds"
echo ""

