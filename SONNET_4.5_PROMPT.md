# 🤖 Prompt për Sonnet 4.5 - Homepage Fixes

## 📋 Copy & Paste këtë në Sonnet 4.5 Chat

```
I have critical issues with the homepage that need to be fixed. Please analyze the codebase and create fixes.

## Problem 1: Posts Change Order During Scroll

**Issue:**
Posts on the homepage appear in wrong order during scrolling. Videos and images display together and swap positions.

**Current Code (site/app/page.tsx):**
- Lines 45-48: Virtual scrolling state (`visibleStartIndex`, `visibleEndIndex`)
- Lines 60-63: `visiblePosts` uses `slice(visibleStartIndex, visibleEndIndex)` which changes during scroll
- Lines 66-82: `handleScroll` updates `visibleStartIndex` and `visibleEndIndex` during scroll
- Line 960: Key prop uses `post.id-${index}` which changes

**Fix Required:**
1. Remove virtual scrolling completely (remove visibleStartIndex, visibleEndIndex, handleScroll)
2. Render all posts directly (don't slice)
3. Change key from `post.id-${index}` to `post.id`
4. Keep IntersectionObserver for infinite scroll (but don't use it for virtual scrolling)

## Problem 2: Video and Image Display Together

**Issue:**
Posts that have both video and thumbnail assets show both simultaneously. Display priority is unclear.

**Current Code (site/components/post-card.tsx):**
- Lines 449-459: Asset selection logic
- Lines 545-574: Rendering logic shows video OR image, but AutoPlayVideo might show thumbnail separately

**Fix Required:**
1. Clear priority: Video > Image/Thumbnail
2. If video exists, show ONLY video (AutoPlayVideo handles thumbnail internally)
3. If no video, show image/thumbnail
4. Ensure AutoPlayVideo doesn't render thumbnail separately when video is playing
5. Only one asset should display at a time

## Problem 3: Infinite Scroll Pagination Stops

**Issue:**
Infinite scroll stops loading posts after some time. `hasMore` becomes false prematurely.

**Current Code (site/app/page.tsx):**
- Lines 297-305: `loadMore` function
- Lines 63-81 (or similar): IntersectionObserver for infinite scroll
- Dependency arrays may cause stale closures

**Fix Required:**
1. Verify `hasMore` calculation in `/site/app/api/posts/route.ts`
2. Verify `hasMore` calculation in `/site/app/api/recommendations/route.ts`
3. Fix dependency arrays in `loadMore` useCallback
4. Improve IntersectionObserver logic
5. Ensure pagination continues until truly no more posts

## Files to Modify:

1. `/site/app/page.tsx`
   - Remove virtual scrolling (lines 45-48, 60-63, 66-88)
   - Fix infinite scroll pagination (lines 297-305, IntersectionObserver)
   - Fix key prop (line ~960)

2. `/site/components/post-card.tsx`
   - Fix video/image display priority (lines 449-459, 545-574)

3. `/site/components/auto-play-video.tsx`
   - Verify it doesn't show thumbnail separately when video exists

4. `/site/app/api/posts/route.ts`
   - Verify `hasMore` calculation is correct

5. `/site/app/api/recommendations/route.ts`
   - Verify `hasMore` calculation is correct

## Expected Results:

1. ✅ Posts remain in stable order during scroll (no position changes)
2. ✅ Only video OR image displays (not both)
3. ✅ Infinite scroll continues until all posts are loaded
4. ✅ Smooth scrolling without lag
5. ✅ No post "jumping" or re-ordering

## Please:

1. Analyze all mentioned files
2. Create specific code fixes for each issue
3. Show before/after code examples
4. Explain why each change fixes the problem
5. Create a pull request with all fixes

Thank you!
```

---

## 🚀 Si të Përdoret

1. **Shkoni në Pull Request:**
   https://github.com/enikqi/yapgrid/pull/new/fix/homepage-scroll-and-pagination

2. **Krijoni Pull Request** me description nga `PR_DESCRIPTION_HOMEPAGE_FIXES.md`

3. **Hapni Sonnet 4.5** (GitHub Copilot Chat)

4. **Kopjoni dhe ngjisni prompt-in** nga lart

5. **Sonnet 4.5 do të:**
   - Analizojë të gjitha files
   - Identifikojë problemet
   - Krijojë fixes
   - Krijojë code suggestions
   - Shpjegojë çdo ndryshim

6. **Apply suggestions** dhe merge PR

7. **Auto-deploy!** 🚀

---

## 📝 Alternative: Quick Prompt

```
Fix homepage issues:
1. Remove virtual scrolling causing post re-ordering
2. Fix video/image display priority  
3. Fix infinite scroll pagination stopping early

Files: /site/app/page.tsx, /site/components/post-card.tsx
```

---

**Ready to use!** 🎉

