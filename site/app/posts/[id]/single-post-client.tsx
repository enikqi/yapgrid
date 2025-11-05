'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PostCard } from '@/components/post-card'
import { VideoModal } from '@/components/video/video-modal'
import { MainHeader } from '@/components/header/main-header'
import { SimpleLogo } from '@/components/logo'
import { ChevronRight, TrendingUp, Users, Calendar, Bell, BellOff, ExternalLink } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast, Toaster } from 'react-hot-toast'
import type { Post, Asset } from '@/lib/types'

interface SinglePostPageClientProps {
  post: Post & { assets: Asset[] }
  initialRelatedPosts?: (Post & { assets: Asset[] })[]
}

export function SinglePostPageClient({ post, initialRelatedPosts = [] }: SinglePostPageClientProps) {
  const { data: session } = useSession()
  const [selectedPost, setSelectedPost] = useState<(Post & { assets: Asset[] }) | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<(Post & { assets: Asset[] })[]>(initialRelatedPosts)
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  // No need to fetch related posts - we have them from server
  // Only fetch more if we need to refresh
  useEffect(() => {
    // If we already have initial posts, don't fetch again
    if (initialRelatedPosts.length > 0) {
      return
    }

    // Only fetch if we don't have initial data
    const fetchRelatedPosts = async () => {
      try {
        setLoadingRelated(true)
        const response = await fetch(`/api/posts?subreddit=${post.subreddit}&limit=5`)
        if (response.ok) {
          const data = await response.json()
          const filtered = data.posts?.filter((p: Post) => p.id !== post.id).slice(0, 4) || []
          setRelatedPosts(filtered)
        }
      } catch (error) {
        console.error('Failed to load related posts:', error)
      } finally {
        setLoadingRelated(false)
      }
    }

    fetchRelatedPosts()
  }, [post.subreddit, post.id, initialRelatedPosts.length])

  // Check subscription status
  useEffect(() => {
    if (session?.user && post.subreddit) {
      fetch(`/api/subscriptions?subreddit=${post.subreddit}`)
        .then(res => res.json())
        .then(data => {
          setIsSubscribed(data.isSubscribed || false)
        })
        .catch(() => {})
    }
  }, [session, post.subreddit])

  const handleSubscribe = async () => {
    if (!session?.user) {
      toast.error('Please sign in to subscribe')
      return
    }

    setSubscribing(true)
    try {
      const response = await fetch('/api/subscriptions', {
        method: isSubscribed ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subreddit: post.subreddit })
      })

      if (response.ok) {
        setIsSubscribed(!isSubscribed)
        toast.success(isSubscribed ? 'Unsubscribed' : 'Subscribed!')
      } else {
        toast.error('Failed to update subscription')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        {/* Header Navigation - Same as homepage */}
        <MainHeader showSearch={false} />

        {/* Main Layout */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Main Content - Left Side */}
            <main className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <div className="mb-4">
                <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Link href="/" className="hover:text-orange-500 transition-colors">
                    Home
                  </Link>
                  <span>/</span>
                  <Link href={`/y/${post.subreddit}`} className="hover:text-orange-500 transition-colors">
                    y/{post.subreddit}
                  </Link>
                  <span>/</span>
                  <span className="text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-[400px]">
                    {post.title}
                  </span>
                </nav>
              </div>

              {/* Post Content */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <PostCard
                  post={post}
                  onVideoPlay={setSelectedPost}
                  showPlayButton={true}
                  isFullPage={true}
                />
              </div>
            </main>

            {/* Right Sidebar - Reddit Style */}
            <aside className="hidden lg:block w-80 space-y-4">
              {/* Subreddit Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header with gradient */}
                <div className="h-12 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                
                <div className="p-4 -mt-6">
                  {/* Community Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 mb-3">
                    <span className="text-white font-bold text-xl">Y</span>
                  </div>
                  
                  {/* Community Name */}
                  <Link 
                    href={`/y/${post.subreddit}`}
                    className="font-bold text-xl text-gray-900 dark:text-gray-100 hover:text-orange-500 transition-colors block mb-1"
                  >
                    y/{post.subreddit}
                  </Link>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Community for {post.subreddit} discussions and content
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Members</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Created</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      className={`w-full py-2 px-4 rounded-full font-medium text-sm transition-colors ${
                        isSubscribed
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                      {isSubscribed ? (
                        <>
                          <BellOff className="w-4 h-4" />
                          Joined
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4" />
                          Join
                        </>
                      )}
                    </button>
                    
                    <Link
                      href={`/y/${post.subreddit}`}
                      className="w-full py-2 px-4 rounded-full border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-center block flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Community
                    </Link>
                  </div>
                </div>
              </div>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      More from r/{post.subreddit}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {relatedPosts.map((relatedPost) => {
                      const thumbnail = relatedPost.assets?.find(a => a.type === 'THUMBNAIL')
                      return (
                        <Link
                          key={relatedPost.id}
                          href={`/posts/${relatedPost.id}`}
                          className="flex gap-3 group"
                        >
                          {thumbnail?.url && (
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                              <img
                                src={thumbnail.url.startsWith('/media/') ? `/api${thumbnail.url}` : thumbnail.url}
                                alt={relatedPost.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-orange-500 transition-colors line-clamp-2">
                              {relatedPost.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {relatedPost.score || 0} upvotes
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                  <Link
                    href={`/y/${post.subreddit}`}
                    className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                  >
                    View all posts
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Premium Card */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <SimpleLogo size="sm" className="mb-2" />
                <h3 className="font-semibold mb-1">YapGrid Premium</h3>
                <p className="text-sm text-orange-100 mb-3">
                  Ad-free browsing and exclusive features
                </p>
                <button className="w-full bg-white text-orange-600 py-2 px-4 rounded-full hover:bg-orange-50 transition-colors text-sm font-medium">
                  Try Premium
                </button>
              </div>
            </aside>
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
      
      {/* Toast Notifications */}
      <Toaster position="top-center" />
    </>
  )
}

