'use client'

import { useState } from 'react'
import { PostCard } from '@/components/post-card'
import { VideoModal } from '@/components/video/video-modal'
import type { Post, Asset, PaginatedResponse } from '@/lib/types'

interface PostsPageClientProps {
  posts: (Post & { assets: Asset[] })[]
  paginatedData: PaginatedResponse<Post & { assets: Asset[] }>
  page: number
  sort: string
  type: string
}

export function PostsPageClient({ posts, paginatedData, page, sort, type }: PostsPageClientProps) {
  const [selectedPost, setSelectedPost] = useState<(Post & { assets: Asset[] }) | null>(null)

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              All Posts
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Browse all posts from YapGrid communities
            </p>
            
            {/* Filters */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</span>
                <a 
                  href="/posts?sort=latest" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    sort === 'latest' ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Latest
                </a>
                <a 
                  href="/posts?sort=trending" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    sort === 'trending' ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Trending
                </a>
                <a 
                  href="/posts?sort=popular" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    sort === 'popular' ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Popular
                </a>
              </div>
              
              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
                <a 
                  href="/posts?type=all" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    type === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </a>
                <a 
                  href="/posts?type=videos" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    type === 'videos' ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Videos
                </a>
                <a 
                  href="/posts?type=images" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    type === 'images' ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Images
                </a>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <div key={`${post.id}-${index}`} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <PostCard
                  post={post}
                  onVideoPlay={setSelectedPost}
                  showPlayButton={true}
                  isCompact={true}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              {page > 1 && (
                <a 
                  href={`/posts?page=${page - 1}&sort=${sort}&type=${type}`}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </a>
              )}
              <span className="px-4 py-2 bg-orange-500 text-white rounded-lg">
                Page {page}
              </span>
              {paginatedData.hasMore && (
                <a 
                  href={`/posts?page=${page + 1}&sort=${sort}&type=${type}`}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
            <p>Showing {posts.length} posts • Page {page}</p>
            {paginatedData.hasMore && (
              <p>More posts available on next pages</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Video Modal */}
      {selectedPost && (
        <VideoModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  )
}


