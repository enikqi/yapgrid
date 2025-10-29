'use client'

import { useEffect, useRef, useCallback } from 'react'
import Masonry from 'react-masonry-css'
import { useInView } from 'react-intersection-observer'
import { VideoCard } from './video-card'
import { VideoCardSkeleton } from './video-card-skeleton'
import type { Post, Asset } from '@/lib/types'

interface MasonryGridProps {
  posts: (Post & { assets: Asset[] })[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onVideoPlay?: (post: Post) => void
}

export function MasonryGrid({
  posts,
  loading = false,
  hasMore = false,
  onLoadMore,
  onVideoPlay,
}: MasonryGridProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  useEffect(() => {
    if (inView && hasMore && !loading && onLoadMore) {
      onLoadMore()
    }
  }, [inView, hasMore, loading, onLoadMore])

  // Responsive breakpoints
  const breakpointColumns = {
    default: 6,  // ≥1440px: 6 columns
    1439: 5,     // 1024-1439: 5 columns
    1023: 4,     // 768-1023: 4 columns
    767: 3,      // 480-767: 3 columns
    479: 2,      // 320-479: 2 columns
    319: 1,      // <320: 1 column
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {posts.map((post) => (
          <VideoCard
            key={post.id}
            post={post}
            onPlay={() => onVideoPlay?.(post)}
          />
        ))}
      </Masonry>

      {/* Loading skeleton */}
      {loading && (
        <Masonry
          breakpointCols={breakpointColumns}
          className="masonry-grid mt-6"
          columnClassName="masonry-grid-column"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <VideoCardSkeleton key={`skeleton-${i}`} />
          ))}
        </Masonry>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && !loading && (
        <div ref={ref} className="h-10 w-full" />
      )}

      {/* End of content */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No more videos to load
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">
            No videos found. Check back later!
          </p>
        </div>
      )}
    </>
  )
}
