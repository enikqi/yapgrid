'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { VideoModal } from '@/components/video/video-modal'
import { PostCard } from '@/components/post-card'
import { ArrowLeft, Search, ChevronDown, TrendingUp, Flame, Clock, Award, ArrowUp } from 'lucide-react'
import Link from 'next/link'
import type { Post, Asset } from '@/lib/types'

type SortOption = 'best' | 'hot' | 'new' | 'top' | 'rising'

export default function SubredditPage() {
  const params = useParams()
  const subreddit = params.subreddit as string
  
  const [posts, setPosts] = useState<(Post & { assets: Asset [] })[]>([])
  const [loading, setLoading] = useState(false) // Start as false, will be set to true when fetching
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedPost, setSelectedPost] = useState<(Post & { assets: Asset[] }) | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<(Post & { assets: Asset[] })[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchTotal, setSearchTotal] = useState(0)
  const [sortBy, setSortBy] = useState<SortOption>('best')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      // Only show loading for page 1
      if (pageNum === 1) {
        setLoading(true)
      }
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '15', // Reduced from 20 to 15 for faster initial load
        status: 'PUBLISHED',
        subreddit: subreddit,
        includeNsfw: 'false',
        sortBy: sortBy
      })

      const response = await fetch(`/api/posts?${params}`, {
        // Add cache headers for faster subsequent loads
        next: { revalidate: 60 } // Cache for 60 seconds
      })
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
        if (pageNum === 1) {
          setPosts([])
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      if (pageNum === 1) {
        setPosts([])
      }
    } finally {
      if (pageNum === 1) {
        setLoading(false)
      }
    }
  }, [subreddit, sortBy])

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.sort-dropdown')) {
        setShowSortDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort)
    setShowSortDropdown(false)
    setPage(1)
    setPosts([])
    // fetchPosts will be called automatically by useEffect when sortBy changes
  }, [])

  const sortOptions: Array<{ value: SortOption; label: string; icon: React.ComponentType<any> }> = [
    { value: 'best', label: 'Best', icon: TrendingUp },
    { value: 'hot', label: 'Hot', icon: Flame },
    { value: 'new', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: Award },
    { value: 'rising', label: 'Rising', icon: ArrowUp },
  ]

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
                <span className="text-lg font-bold text-orange-500">y/{subreddit}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Community</span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search y/${subreddit}...`}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Y</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">y/{subreddit}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Posts from y/{subreddit} community
                  </p>
                </div>
              </div>
              
              {/* Sort Dropdown */}
              <div className="relative sort-dropdown">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
                >
                  {sortOptions.find(opt => opt.value === sortBy)?.icon && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {(() => {
                        const Icon = sortOptions.find(opt => opt.value === sortBy)?.icon
                        return Icon ? <Icon className="w-4 h-4" /> : null
                      })()}
                    </span>
                  )}
                  <span className="font-medium capitalize">{sortBy}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                      {sortOptions.map(option => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                              sortBy === option.value
                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                : 'text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{option.label}</span>
                            {sortBy === option.value && (
                              <span className="ml-auto text-orange-500">✓</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
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
                Found {searchTotal} result{searchTotal !== 1 ? 's' : ''} for "{searchQuery}" in y/{subreddit} (showing {posts.length})
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
                No posts found for y/{subreddit}
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
