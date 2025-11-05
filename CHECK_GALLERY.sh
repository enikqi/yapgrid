#!/bin/bash

echo "================================================"
echo "🖼️  GALLERY POSTS CHECKER"
echo "================================================"

cd /home/ubuntu/apps/yapgrid/site

echo ""
echo "Checking for posts with multiple images..."
echo ""

npx prisma db execute --stdin <<'EOF'
SELECT 
    p.id,
    p.title,
    p.status,
    COUNT(a.id) as image_count,
    p."createdAt"
FROM "Post" p
LEFT JOIN "Asset" a ON a."postId" = p.id AND a.type = 'THUMBNAIL'
GROUP BY p.id, p.title, p.status, p."createdAt"
HAVING COUNT(a.id) > 1
ORDER BY p."createdAt" DESC
LIMIT 10;
EOF

echo ""
echo "================================================"
echo "Recent posts with their asset counts:"
echo "================================================"

npx prisma db execute --stdin <<'EOF'
SELECT 
    p.id,
    p.title,
    p.url,
    p.status,
    COUNT(a.id) as total_assets,
    SUM(CASE WHEN a.type = 'THUMBNAIL' THEN 1 ELSE 0 END) as images,
    SUM(CASE WHEN a.type = 'VIDEO' THEN 1 ELSE 0 END) as videos,
    p."createdAt"
FROM "Post" p
LEFT JOIN "Asset" a ON a."postId" = p.id
GROUP BY p.id, p.title, p.url, p.status, p."createdAt"
ORDER BY p."createdAt" DESC
LIMIT 15;
EOF

