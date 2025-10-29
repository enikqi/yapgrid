'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { VideoModal } from '@/components/video/video-modal'
import { PostCard } from '@/components/post-card'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import type { Post, Asset } from '@/lib/types'

export default function SubredditPage() {
  const params = useParams()
  const subreddit = params.subreddit as string
  
  const [posts, setPosts] = useState<(Post & { assets: Asset[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedPost, setSelectedPost] = useState<(Post & { assets: Asset[] }) | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<(Post & { assets: Asset[] })[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchTotal, setSearchTotal] = useState(0)

  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '20',
        status: 'PUBLISHED',
        subreddit: subreddit,
        includeNsfw: 'false'
      })

      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()

      if (data.success) {
        if (pageNum === 1) {
          setPosts(data.data.items)
        } else {
          setPosts(prev => [...prev, ...data.data.items])
        }
        setHasMore(data.data.hasMore)
      } else {
        console.error('Failed to fetch posts:', data.error)
        // Set empty posts array on error
        if (pageNum === 1) {
          setPosts([])
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      // Set empty posts array on error
      if (pageNum === 1) {
        setPosts([])
      }
    } finally {
      setLoading(false)
    }
  }, [subreddit])

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !isSearching) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage)
    }
  }, [loading, hasMore, page, fetchPosts, isSearching])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false)
      setSearchQuery('')
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setSearchQuery(query)
    setSearchPage(1)

    try {
      const params = new URLSearchParams({
        q: query.toLowerCase(),
        page: '1',
        pageSize: '20',
        includeNsfw: 'false'
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (data.success) {
        // Filter search results to only show posts from this subreddit
        const filteredResults = data.data.items.filter((post: Post & { assets: Asset[] }) => 
          post.subreddit.toLowerCase() === subreddit.toLowerCase()
        )
        
        setSearchResults(filteredResults)
        setSearchHasMore(data.data.hasMore)
        setSearchTotal(filteredResults.length)
        setPosts(filteredResults)
      } else {
        console.error('Search failed:', data.error)
        setSearchResults([])
        setPosts([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setPosts([])
    }
  }, [subreddit])

  const loadMoreSearchResults = useCallback(async () => {
    if (!loading && searchHasMore && isSearching) {
      try {
        setLoading(true)
        const nextPage = searchPage + 1
        setSearchPage(nextPage)

        const params = new URLSearchParams({
          q: searchQuery.toLowerCase(),
          page: nextPage.toString(),
          pageSize: '20',
          includeNsfw: 'false'
        })

        const response = await fetch(`/api/search?${params}`)
        const data = await response.json()

        if (data.success) {
          // Filter search results to only show posts from this subreddit
          const filteredResults = data.data.items.filter((post: Post & { assets: Asset[] }) => 
            post.subreddit.toLowerCase() === subreddit.toLowerCase()
          )
          
          setSearchResults(prev => [...prev, ...filteredResults])
          setSearchHasMore(data.data.hasMore)
          setPosts(prev => [...prev, ...filteredResults])
        }
      } catch (error) {
        console.error('Load more search results error:', error)
      } finally {
        setLoading(false)
      }
    }
  }, [loading, searchHasMore, isSearching, searchPage, searchQuery, searchResults, subreddit])

  const handlePostDelete = useCallback((postId: string) => {
    // Remove the post from all relevant state arrays
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
    setSearchResults(prevPosts => prevPosts.filter(post => post.id !== postId))
  }, [])

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-orange-500">r/{subreddit}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Subreddit</span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search r/${subreddit}...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Subreddit info */}
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">r/</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">r/{subreddit}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Posts from r/{subreddit} subreddit
                </p>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-3">
            {posts.map((post, index) => (
              <PostCard
                key={`${post.id}-${index}`}
                post={post}
                onVideoPlay={setSelectedPost}
                onPostDelete={handlePostDelete}
                showPlayButton={true}
              />
            ))}
          </div>

          {/* Load more button */}
          {!isSearching && hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Load More Posts'}
              </button>
            </div>
          )}

          {/* Load more search results button */}
          {isSearching && searchHasMore && (
            <div className="text-center mt-6">
              <button
                onClick={loadMoreSearchResults}
                disabled={loading}
                className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Load More Results'}
              </button>
            </div>
          )}

          {/* Search results info */}
          {isSearching && (
            <div className="text-center mt-6">
              <p className="text-gray-600 dark:text-gray-400">
                Found {searchTotal} result{searchTotal !== 1 ? 's' : ''} for "{searchQuery}" in r/{subreddit} (showing {posts.length})
              </p>
              <button
                onClick={() => handleSearch('')}
                className="mt-2 px-4 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Loading indicator */}
          {loading && posts.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading posts...</p>
            </div>
          )}

          {/* No posts */}
          {!loading && posts.length === 0 && !isSearching && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No posts found for r/{subreddit}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This community doesn't have any published posts yet.
              </p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          )}
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
