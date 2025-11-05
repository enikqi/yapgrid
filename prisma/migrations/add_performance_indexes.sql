-- Performance optimization indexes for YapGrid
-- Run this migration to significantly improve query performance

-- Index for published posts sorted by publishedAt (most common query)
CREATE INDEX IF NOT EXISTS idx_posts_published_date 
ON "Post"("status", "publishedAt" DESC, "nsfw")
WHERE "status" = 'PUBLISHED';

-- Index for trending posts sorted by score
CREATE INDEX IF NOT EXISTS idx_posts_trending_score 
ON "Post"("status", "score" DESC, "nsfw")
WHERE "status" = 'PUBLISHED';

-- Index for subreddit filtering
CREATE INDEX IF NOT EXISTS idx_posts_subreddit 
ON "Post"("subreddit", "status", "publishedAt" DESC);

-- Index for assets lookup by postId and type
CREATE INDEX IF NOT EXISTS idx_assets_post_type 
ON "Asset"("postId", "type");

-- Index for video assets specifically (most queried)
CREATE INDEX IF NOT EXISTS idx_assets_video 
ON "Asset"("postId", "type", "storage")
WHERE "type" = 'VIDEO';

-- Index for hidden posts filtering
CREATE INDEX IF NOT EXISTS idx_hidden_posts_user 
ON "HiddenPost"("userId", "postId");

-- Index for user profile lookup
CREATE INDEX IF NOT EXISTS idx_user_profile_userid 
ON "UserProfile"("userId");

-- Index for votes lookup
CREATE INDEX IF NOT EXISTS idx_votes_post_user 
ON "Vote"("postId", "userId");

-- Index for bookmarks lookup
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_post 
ON "Bookmark"("userId", "postId");

-- Analyze tables for query planner optimization
ANALYZE "Post";
ANALYZE "Asset";
ANALYZE "HiddenPost";
ANALYZE "Vote";
ANALYZE "Bookmark";
ANALYZE "UserProfile";

