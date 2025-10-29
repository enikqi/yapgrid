'use client'

import { useState } from 'react'
import { PostCard } from '@/components/post-card'
import { VideoModal } from '@/components/video/video-modal'
import type { Post, Asset } from '@/lib/types'

interface PostPageClientProps {
  post: Post & { assets: Asset[] }
}

export function PostPageClient({ post }: PostPageClientProps) {
  const [selectedPost, setSelectedPost] = useState<(Post & { assets: Asset[] }) | null>(null)

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back button */}
          <div className="mb-6">
            <a 
              href="/" 
              className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
          
          {/* Post content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <PostCard
              post={post}
              onVideoPlay={setSelectedPost}
              showPlayButton={true}
              isFullPage={true}
            />
          </div>
          
          {/* Related posts section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              More from r/{post.subreddit}
            </h2>
            <div className="text-gray-600 dark:text-gray-400">
              <a 
                href={`/r/${post.subreddit}`}
                className="text-orange-500 hover:text-orange-600 transition-colors"
              >
                View all posts from r/{post.subreddit} →
              </a>
            </div>
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


