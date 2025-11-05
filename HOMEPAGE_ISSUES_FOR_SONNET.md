# 🐛 Homepage Issues - Për Sonnet 4.5 Review dhe Fix

## 📋 Verifikim: GitHub Shikon Files Aktual

**Status:** ✅ **PO** - GitHub shikon files aktual që gjenden në server.

**Verifikim:**
- Server branch: `main`
- GitHub branch: `main`
- Latest commit: `151b546`
- Files synced: ✅ YES

**Shikoni në GitHub:**
- https://github.com/enikqi/yapgrid/tree/main
- Të gjitha files aktual janë në GitHub

---

## 🔴 Problemet Kritike që Duhen Rregulluar

### **Problemi 1: Postet Ndryshojnë Vendet Gjatë Scroll-it**

**Përshkrimi:**
- Postet në homepage shfaqen në rend të gabuar gjatë scroll-it
- Video dhe imazhe shfaqen së bashku dhe ndryshojnë vendet
- Renditja e posteve ndryshon kur scroll-on
- Postet "kërcejnë" në pozicione të ndryshme

**Files të Aftësuar:**
- `/site/app/page.tsx` - Homepage component
- `/site/components/post-card.tsx` - Post rendering

**Kodi Aktual Problem:**
```typescript
// Në page.tsx - Virtual scrolling po shkakton probleme
const visiblePosts = useMemo(() => {
  const currentPosts = isSearching ? searchResults : posts
  return currentPosts.slice(visibleStartIndex, visibleEndIndex)
}, [posts, searchResults, isSearching, visibleStartIndex, visibleEndIndex])

// Scroll handler po ndryshon visibleStartIndex dhe visibleEndIndex
const handleScroll = useCallback(() => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const newStartIndex = Math.floor(scrollTop / 400)
  const newEndIndex = Math.min(newStartIndex + ITEMS_PER_PAGE, posts.length)
  setVisibleStartIndex(newStartIndex)
  setVisibleEndIndex(newEndIndex)
  // ...
}, [posts.length, hasMore, loadMoreLoading])
```

**Problemi:**
- Virtual scrolling po ndryshon `visibleStartIndex` dhe `visibleEndIndex` gjatë scroll-it
- Kjo shkakton që React të re-render-ojë postet në pozicione të ndryshme
- Key prop përdor `index` që ndryshon, duke shkaktuar re-ordering

---

### **Problemi 2: Video dhe Imazhe Shfaqen Së Bashku**

**Përshkrimi:**
- Postet që kanë video dhe thumbnail shfaqen të dyja së bashku
- Video dhe imazhe ndryshojnë vendet gjatë scroll-it
- Display logic nuk është i qartë për çfarë të shfaqë

**Files të Aftësuar:**
- `/site/components/post-card.tsx` - Media rendering logic
- `/site/components/auto-play-video.tsx` - Video player

**Kodi Aktual Problem:**
```typescript
// Në post-card.tsx
const hasVideo = post.assets.some(a => a.type === 'VIDEO')
const displayAsset = post.assets.find(a => 
  a.type === 'THUMBNAIL' || a.type === 'IMAGE'
)

// Rendering
{hasVideo ? (
  <AutoPlayVideo ... />
) : displayAsset?.url ? (
  <img ... />
) : null}
```

**Problemi:**
- Nëse post ka video DHE thumbnail, duhet të shfaqet vetëm video
- Nëse post ka vetëm thumbnail/image, duhet të shfaqet image
- Logic aktual mund të shkaktojë konfuzion

---

### **Problemi 3: Pagination Nuk Funksionon - Ndalet Pas Disa Posteve**

**Përshkrimi:**
- Infinite scroll nuk ngarkon më poste pas një kohe
- `hasMore` bëhet `false` para kohe
- Pagination ndalet edhe pse ka më shumë poste në database

**Files të Aftësuar:**
- `/site/app/page.tsx` - Load more logic
- `/site/app/api/posts/route.ts` - API pagination
- `/site/app/api/recommendations/route.ts` - Recommendations API

**Kodi Aktual Problem:**
```typescript
// Në page.tsx
const loadMore = useCallback(() => {
  if (!loading && !loadMoreLoading && hasMore && !isSearching && !isFiltering) {
    setPage(prevPage => {
      const nextPage = prevPage + 1
      setTimeout(() => {
        fetchPosts(nextPage, currentAlgorithm)
      }, 0)
      return nextPage
    })
  }
}, [loading, loadMoreLoading, hasMore, fetchPosts, currentAlgorithm, isSearching, isFiltering])

// IntersectionObserver
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

**Problemi:**
- `hasMore` mund të bëhet `false` gabimisht
- API mund të kthejë `hasMore: false` edhe pse ka më shumë poste
- IntersectionObserver mund të mos trigger-on si duhet
- Dependency array në `loadMore` mund të shkaktojë stale closures

---

## 🎯 Zgjidhjet që Duhen Implementuar

### **Zgjidhja 1: Fix Post Ordering During Scroll**

**Çfarë duhet bërë:**
1. Hiq virtual scrolling që shkakton probleme me ordering
2. Përdor të gjitha postet në render (jo slice)
3. Përdor `post.id` si key (jo `index`)
4. Sigurohuni që posts array mbetet i qëndrueshëm

**Kodi që duhet ndryshuar:**
```typescript
// Në vend të:
const visiblePosts = useMemo(() => {
  return currentPosts.slice(visibleStartIndex, visibleEndIndex)
}, [posts, searchResults, isSearching, visibleStartIndex, visibleEndIndex])

// Duhet:
const visiblePosts = useMemo(() => {
  const currentPosts = isSearching ? searchResults : posts
  return currentPosts // Render të gjitha, jo slice
}, [posts, searchResults, isSearching])

// Dhe në render:
{visiblePosts.map((post) => (
  <PostCard key={post.id} post={post} ... />
))}
```

---

### **Zgjidhja 2: Fix Video/Image Display Logic**

**Çfarë duhet bërë:**
1. Prioritet i qartë: Video > Image > Thumbnail
2. Nëse ka video, shfaq vetëm video (jo thumbnail)
3. Nëse nuk ka video, shfaq image/thumbnail
4. Sigurohuni që vetëm një asset shfaqet në një kohë

**Kodi që duhet ndryshuar:**
```typescript
// Në post-card.tsx
const videoAsset = post.assets.find(a => a.type === 'VIDEO')
const imageAsset = post.assets.find(a => 
  a.type === 'IMAGE' || a.type === 'THUMBNAIL'
) && !videoAsset // Vetëm nëse nuk ka video

// Rendering me priority:
{videoAsset ? (
  <AutoPlayVideo post={post} asset={videoAsset} ... />
) : imageAsset ? (
  <img src={imageAsset.url} ... />
) : null}
```

---

### **Zgjidhja 3: Fix Infinite Scroll Pagination**

**Çfarë duhet bërë:**
1. Sigurohuni që `hasMore` llogaritet saktë në API
2. Fix dependency arrays për të shmangur stale closures
3. Përmirëso IntersectionObserver logic
4. Add retry mechanism nëse loadMore dështon

**Kodi që duhet ndryshuar:**
```typescript
// Fix loadMore dependencies
const loadMore = useCallback(() => {
  if (!loading && !loadMoreLoading && hasMore && !isSearching && !isFiltering) {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage, currentAlgorithm)
  }
}, [loading, loadMoreLoading, hasMore, isSearching, isFiltering, page, fetchPosts, currentAlgorithm])

// Better IntersectionObserver
useEffect(() => {
  const sentinel = loadMoreSentinelRef.current
  if (!sentinel || isSearching || isFiltering || !hasMore) return
  
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadMoreLoading && !loading) {
        loadMore()
      }
    },
    { rootMargin: '1000px' } // Load earlier
  )
  
  observer.observe(sentinel)
  return () => observer.disconnect()
}, [hasMore, loadMoreLoading, loading, isSearching, isFiltering, loadMore])
```

---

## 📝 Prompt për Sonnet 4.5

### **Prompt 1: Review dhe Fix Issues**

```
I have critical issues with the homepage that need to be fixed:

**Problem 1: Posts Change Order During Scroll**
- Posts appear in wrong order during scrolling
- Videos and images display together and swap positions
- Virtual scrolling is causing React to re-order posts

**Problem 2: Video/Image Display Logic**
- Posts with both video and thumbnail show both
- Display priority is unclear
- Should show: Video (if exists) > Image/Thumbnail (if no video)

**Problem 3: Infinite Scroll Pagination Stops**
- Pagination stops loading after some posts
- `hasMore` becomes false prematurely
- Infinite scroll doesn't continue to the end

**Files to Fix:**
1. `/site/app/page.tsx` - Homepage component
2. `/site/components/post-card.tsx` - Post rendering
3. `/site/components/auto-play-video.tsx` - Video player

**Requirements:**
1. Remove virtual scrolling that causes ordering issues
2. Render all posts in order (don't slice)
3. Use `post.id` as key (not index)
4. Fix video/image display priority
5. Fix infinite scroll to continue until all posts are loaded
6. Ensure stable ordering during scroll

Please analyze the code and create fixes for all three issues.
```

### **Prompt 2: Specific Code Fixes**

```
Analyze and fix these specific issues in the homepage:

**File: `/site/app/page.tsx`**

1. **Remove virtual scrolling:**
   - Current code uses `visibleStartIndex` and `visibleEndIndex` to slice posts
   - This causes posts to re-order during scroll
   - Fix: Remove slice, render all posts

2. **Fix key prop:**
   - Current: `key={post.id}-${index}`
   - Problem: Index changes during scroll
   - Fix: `key={post.id}`

3. **Fix loadMore dependencies:**
   - Current dependencies may cause stale closures
   - Fix: Include all used variables in dependency array

**File: `/site/components/post-card.tsx`**

1. **Fix media display priority:**
   - Show video if exists (ignore thumbnail)
   - Show image/thumbnail only if no video
   - Ensure only one asset displays at a time

2. **Fix asset selection logic:**
   - Current logic may select both video and image
   - Fix: Clear priority order

**File: `/site/app/api/posts/route.ts` or `/site/app/api/recommendations/route.ts`**

1. **Fix hasMore calculation:**
   - Ensure `hasMore` is true when there are more posts
   - Check if pagination logic is correct

Please provide specific code fixes for each issue.
```

---

## 🚀 Workflow Automatik

### **Hapi 1: Push Current State**

```bash
cd /home/ubuntu/apps/yapgrid
git add .
git commit -m "Fix: Homepage issues - scroll ordering, video/image display, pagination"
git push origin main
```

### **Hapi 2: Krijoni Pull Request**

1. Shkoni në: https://github.com/enikqi/yapgrid/pulls
2. Klikoni "New pull request"
3. Base: `main`, Compare: `main` (ose branch të ri)
4. Title: "Fix: Homepage scroll ordering, video/image display, and pagination issues"
5. Description: Kopjoni prompt-et nga dokumenti

### **Hapi 3: Sonnet 4.5 Review**

1. Klikoni "GitHub Copilot" në PR
2. Përdorni prompt-et nga kjo dokument
3. Sonnet 4.5 do të analizojë dhe krijojë fixes

### **Hapi 4: Auto-Deploy**

Pas merge:
- GitHub Actions auto-deploy
- Ose run: `./apply-merged-changes.sh`

---

## ✅ Expected Results

Pas fixes:

1. ✅ **Post Ordering:** Postet mbeten në rend të qëndrueshëm gjatë scroll-it
2. ✅ **Video/Image Display:** Vetëm video ose vetëm image shfaqet (jo të dyja)
3. ✅ **Pagination:** Infinite scroll vazhdon deri në fund të posteve
4. ✅ **Performance:** Smooth scrolling pa lag
5. ✅ **Stability:** Nuk ka më "kërcej" të posteve

---

## 📊 Files që Duhen Modifikuar

1. `/site/app/page.tsx` - Remove virtual scrolling, fix pagination
2. `/site/components/post-card.tsx` - Fix media display logic
3. `/site/components/auto-play-video.tsx` - Ensure proper video rendering
4. `/site/app/api/posts/route.ts` - Fix hasMore calculation
5. `/site/app/api/recommendations/route.ts` - Fix hasMore calculation

---

**Last Updated:** $(date)
**Status:** Ready for Sonnet 4.5 Review

