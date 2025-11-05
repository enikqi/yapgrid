#!/bin/bash

echo "🖼️  Checking for gallery posts (posts with multiple images)..."
echo ""

cd /home/ubuntu/apps/yapgrid/site

# Use psql directly
PGPASSWORD=$(grep DATABASE_URL .env.production.local | cut -d'@' -f2 | cut -d'/' -f2) 
DB_NAME=$(grep DATABASE_URL .env.production.local | grep -oP '/[^/]+$' | tr -d '/')
DB_HOST=$(grep DATABASE_URL .env.production.local | grep -oP '@\K[^:/]+')
DB_USER=$(grep DATABASE_URL .env.production.local | grep -oP '://\K[^:]+')
DB_PASS=$(grep DATABASE_URL .env.production.local | grep -oP ':[^@]+@' | tr -d ':@')

echo "Recent posts with their image counts:"
psql "postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}" -c "
SELECT 
    p.id,
    LEFT(p.title, 50) as title,
    p.status,
    COUNT(CASE WHEN a.type = 'THUMBNAIL' THEN 1 END) as image_count,
    COUNT(CASE WHEN a.type = 'VIDEO' THEN 1 END) as video_count,
    p.\"createdAt\"
FROM \"Post\" p
LEFT JOIN \"Asset\" a ON a.\"postId\" = p.id
WHERE p.status = 'PUBLISHED'
GROUP BY p.id, p.title, p.status, p.\"createdAt\"
HAVING COUNT(CASE WHEN a.type = 'THUMBNAIL' THEN 1 END) > 1
ORDER BY p.\"createdAt\" DESC
LIMIT 10;
" 2>/dev/null || echo "❌ Database connection failed - check DATABASE_URL"

echo ""
echo "Total posts by image count:"
psql "postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}" -c "
SELECT 
    COUNT(CASE WHEN a.type = 'THUMBNAIL' THEN 1 END) as images_per_post,
    COUNT(DISTINCT p.id) as post_count
FROM \"Post\" p
LEFT JOIN \"Asset\" a ON a.\"postId\" = p.id
WHERE p.status = 'PUBLISHED'
GROUP BY p.id
ORDER BY images_per_post DESC;
" 2>/dev/null | head -20

