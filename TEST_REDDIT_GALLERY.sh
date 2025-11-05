#!/bin/bash

echo "================================================"
echo "🧪 TESTING REDDIT GALLERY POST FETCH"
echo "================================================"

GALLERY_URL="https://www.reddit.com/r/Philippines/comments/1onarvy/did_i_save_money/"

echo ""
echo "Testing gallery post:"
echo "$GALLERY_URL"
echo ""

echo "Fetching post data from Reddit..."
curl -s "https://www.reddit.com/r/Philippines/comments/1onarvy.json" \
  -H "User-Agent: Mozilla/5.0" \
  | jq '.[0].data.children[0].data | {
      title: .title,
      is_gallery: .is_gallery,
      media_metadata: (.media_metadata | length),
      gallery_items: (.gallery_data.items | length)
    }'

echo ""
echo "This post should have is_gallery=true and multiple images."
echo ""
echo "To manually trigger fetch, find the campaign ID and run:"
echo "curl -X POST https://yapgrid.com/api/campaigns/[CAMPAIGN_ID]/run"

