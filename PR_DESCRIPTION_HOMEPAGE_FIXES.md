# Pull Request Description - Homepage Fixes

## 🔴 Critical Issues to Fix

### Problem 1: Posts Change Order During Scroll

**Description:**
Posts on the homepage appear in wrong order during scrolling. Videos and images display together and swap positions. The virtual scrolling implementation is causing React to re-order posts as you scroll.

**Current Code Issue:**
```typescript
// site/app/page.tsx - Lines 60-63
const visiblePosts = useMemo(() => {
  const currentPosts = isSearching ? searchResults : posts
  return currentPosts.slice(visibleStartIndex, visibleEndIndex)
}, [posts, searchResults, isSearching, visibleStartIndex, visibleEndIndex])

// Lines 66-82 - Scroll handler changes visibleStartIndex/visibleEndIndex
const handleScroll = useCallback(() => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const newStartIndex = Math.floor(scrollTop / 400)
  const newEndIndex = Math.min(newStartIndex + ITEMS_PER_PAGE, posts.length)
  setVisibleStartIndex(newStartIndex)
  setVisibleEndIndex(newEndIndex)
  // ...
}, [posts.length, hasMore, loadMoreLoading])
```

**Fix Required:**
1. Remove virtual scrolling that causes ordering issues
2. Render all posts (don't slice)
3. Use `post.id` as key (not `post.id-${index}`)
4. Ensure stable ordering during scroll

---

### Problem 2: Video and Image Display Together

**Description:**
Posts that have both video and thumbnail assets show both simultaneously. Videos and images swap positions during scroll. The display logic is unclear about what should be shown.

**Current Code Issue:**
```typescript
// site/components/post-card.tsx - Lines 449-459
const videoAsset = post.assets.find(a => a.type === 'VIDEO')
const thumbnailAsset = post.assets.find(a => a.type === 'THUMBNAIL')
const displayAsset = hasVideo ? videoAsset : (thumbnailAsset || post.assets[0])

// Lines 545-574 - Rendering logic
{hasVideo ? (
  <AutoPlayVideo ... />
) : displayAsset?.url ? (
  <img ... />
) : null}
```

**Fix Required:**
1. Clear priority: Video > Image/Thumbnail
2. If video exists, show ONLY video (AutoPlayVideo handles thumbnail internally)
3. If no video, show image/thumbnail
4. Ensure only one asset displays at a time
5. Prevent both video and image from rendering simultaneously

---

### Problem 3: Infinite Scroll Pagination Stops

**Description:**
Infinite scroll stops loading posts after some time. The `hasMore` flag becomes `false` prematurely, even when there are more posts in the database. Pagination doesn't continue to the end.

**Current Code Issue:**
```typescript
// site/app/page.tsx - Lines 297-305
const loadMore = useCallback(() => {
  if (!loading && !loadMoreLoading && hasMore && !isSearching && !isFiltering) {
    setPage(prevPage => {
      const nextPage = prevPage + 1
      fetchPosts(nextPage, currentAlgorithm)
      return nextPage
    })
  }
}, [loading, loadMoreLoading, hasMore, fetchPosts, currentAlgorithm, isSearching, isFiltering])

// Lines 63-81 - IntersectionObserver
useEffect(() => {
  const sentinel = loadMoreSentinelRef.current
  if (!sentinel || isSearching || isFiltering) return
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadMoreLoading && !loading) {
        loadMore()
      }
    },
    { rootMargin: '500px' }
  )
  observer.observe(sentinel)
  return () => observer.disconnect()
}, [hasMore, loadMoreLoading, loading, isSearching, isFiltering, loadMore])
```

**Fix Required:**
1. Verify `hasMore` calculation in API routes
2. Fix dependency arrays to prevent stale closures
3. Improve IntersectionObserver logic
4. Add retry mechanism if loadMore fails
5. Ensure pagination continues until all posts are loaded

---

## 📁 Files to Modify

1. **`site/app/page.tsx`**
   - Remove virtual scrolling
   - Fix post ordering
   - Fix infinite scroll pagination

2. **`site/components/post-card.tsx`**
   - Fix video/image display priority
   - Ensure only one asset displays

3. **`site/components/auto-play-video.tsx`**
   - Verify video rendering doesn't conflict with image rendering

4. **`site/app/api/posts/route.ts`**
   - Verify `hasMore` calculation is correct

5. **`site/app/api/recommendations/route.ts`**
   - Verify `hasMore` calculation is correct

---

## ✅ Expected Results

After fixes:
1. ✅ Posts remain in stable order during scroll
2. ✅ Only video OR image displays (not both)
3. ✅ Infinite scroll continues until all posts are loaded
4. ✅ Smooth scrolling without lag
5. ✅ No post "jumping" or position changes

---

## 🧪 Testing Requirements

1. Test scroll behavior - posts should stay in same order
2. Test video/image display - only one should show
3. Test pagination - should load all available posts
4. Test performance - should be smooth
5. Test different asset types - video, image, gif, etc.

---

## 📝 Code Changes Summary

### Change 1: Remove Virtual Scrolling
- Remove `visibleStartIndex` and `visibleEndIndex` state
- Remove `visiblePosts` slice logic
- Render all posts directly

### Change 2: Fix Key Prop
- Change from `key={post.id}-${index}` to `key={post.id}`
- Ensure stable React keys

### Change 3: Fix Media Display
- Clear priority: video > image
- Ensure AutoPlayVideo doesn't show thumbnail separately
- Only one asset renders at a time

### Change 4: Fix Pagination
- Verify `hasMore` logic
- Fix dependency arrays
- Improve IntersectionObserver

---

**Ready for Sonnet 4.5 to analyze and fix!**

