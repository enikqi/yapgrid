#!/bin/bash

echo "================================================"
echo "🔄 FORCE FETCH NEW POSTS FROM REDDIT"
echo "================================================"

cd /home/ubuntu/apps/yapgrid/site

echo ""
echo "Step 1: Getting active campaigns..."

# Get campaign IDs from database
CAMPAIGN_IDS=$(npx prisma db execute --stdin <<'EOF' | grep -oP '^\s*\K\w+' | tail -n +2
SELECT id FROM "Campaign" WHERE enabled = true AND platform = 'REDDIT';
EOF
)

if [ -z "$CAMPAIGN_IDS" ]; then
    echo "❌ No active Reddit campaigns found!"
    echo ""
    echo "To create a campaign, visit: https://yapgrid.com/admin/campaigns"
    exit 1
fi

echo "Found active campaigns:"
echo "$CAMPAIGN_IDS"

echo ""
echo "Step 2: Triggering manual run for each campaign..."

for CAMPAIGN_ID in $CAMPAIGN_IDS; do
    echo ""
    echo "📥 Fetching from campaign: $CAMPAIGN_ID"
    
    RESPONSE=$(curl -s -X POST "http://localhost:3002/api/campaigns/$CAMPAIGN_ID/run" \
        -H "Content-Type: application/json")
    
    echo "Response: $RESPONSE"
    
    sleep 2
done

echo ""
echo "Step 3: Checking recent posts..."
sleep 5

npx prisma db execute --stdin <<'EOF'
SELECT 
    id,
    title,
    status,
    (SELECT COUNT(*) FROM "Asset" WHERE "postId" = "Post".id) as asset_count,
    "createdAt"
FROM "Post"
ORDER BY "createdAt" DESC
LIMIT 10;
EOF

echo ""
echo "================================================"
echo "✅ Fetch complete! Check logs for details."
echo "================================================"
echo ""
echo "📝 View scheduler logs: tail -f /tmp/scheduler.log"
echo "🌐 Visit site: https://yapgrid.com"
echo ""

