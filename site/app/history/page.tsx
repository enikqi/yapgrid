'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PostCard } from '@/components/post-card'
import { VideoModal } from '@/components/video/video-modal'
import type { Post, Asset } from '@/lib/types'

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [historyPosts, setHistoryPosts] = useState<(Post & { assets: Asset[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<(Post & { assets: Asset[] }) | null>(null)

  useEffect(() => {
    if (status === 'loading') return // Still loading session

    if (!session?.user?.email) {
      // User not authenticated, redirect to sign in
      router.push('/auth/signin')
      return
    }

    const fetchHistoryPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/post-history')
        const data = await response.json()
        
        if (data.success) {
          setHistoryPosts(data.data.items)
        } else {
          console.error('Failed to fetch history posts:', data.error)
        }
      } catch (error) {
        console.error('Error fetching history posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryPosts()
  }, [session, status, router])

  const handlePostDelete = useCallback((postId: string) => {
    // Remove the post from history posts
    setHistoryPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to PinReddit
          </Link>
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              History
            </h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Posts you've recently viewed
          </p>
        </div>

        {/* Content */}
        {status === 'loading' ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading history...</p>
          </div>
        ) : historyPosts.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No history yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your viewing history will appear here as you browse posts.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Browse Posts
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {historyPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onVideoPlay={setSelectedPost}
                onPostDelete={handlePostDelete}
                showPlayButton={false}
              />
            ))}
          </div>
        )}

        {/* Video Modal */}
        {selectedPost && (
          <VideoModal
            post={selectedPost}
            isOpen={!!selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </div>
    </div>
  )
}
