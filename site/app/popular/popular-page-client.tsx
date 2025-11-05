'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { PostCard } from '@/components/post-card'
import { UserMenu } from '@/components/auth/user-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { MobileSearchOverlay } from '@/components/mobile-search-overlay'
import PersonalizedCommunities from '@/components/personalized-communities'
import { Toaster } from 'react-hot-toast'
import type { Post, Asset, PaginatedResponse } from '@/lib/types'
import { Search, Home, TrendingUp, Globe, Video, Image, Menu, X } from 'lucide-react'
import { SimpleLogo } from '@/components/logo'
import { useSession } from 'next-auth/react'
import { deduplicatedApi } from '@/lib/request-deduplication'

export default function PopularPageClient() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<(Post & { assets: Asset[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [communitiesAlgorithm, setCommunitiesAlgorithm] = useState<'trending' | 'popular' | 'hot'>('trending')
  
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null)

  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadMoreLoading(true)
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '15',
        status: 'PUBLISHED',
        includeNsfw: 'false',
        sortBy: 'score' // Popular = sorted by score
      })

      const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]')
      if (hiddenPosts.length > 0) {
        params.append('hiddenPostIds', hiddenPosts.join(','))
      }

      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()

      if (data.success) {
        const paginatedData = data.data as PaginatedResponse<Post & { assets: Asset[] }>

        if (pageNum === 1) {
          setPosts(paginatedData.items)
        } else {
          setPosts(prevPosts => {
            const existingIds = new Set(prevPosts.map(post => post.id))
            const newUniquePosts = paginatedData.items.filter(post => !existingIds.has(post.id))
            return [...prevPosts, ...newUniquePosts]
          })
        }

        setHasMore(paginatedData.hasMore)
      }
    } catch (error) {
      console.error('Failed to fetch popular posts:', error)
    } finally {
      setLoading(false)
      setLoadMoreLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (!loading && !loadMoreLoading && hasMore) {
      setPage((prevPage) => {
        const nextPage = prevPage + 1
        fetchPosts(nextPage)
        return nextPage
      })
    }
  }, [loading, loadMoreLoading, hasMore, fetchPosts])

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadMoreLoading) {
          loadMore()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loadMore, posts.length, loadMoreLoading])

  const handlePostDelete = useCallback((postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
  }, [])

  const handleCommunitiesAlgorithmChange = useCallback((algorithm: 'trending' | 'popular' | 'hot') => {
    setCommunitiesAlgorithm(algorithm)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <SimpleLogo size="sm" />

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Link 
                  href="/"
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-gray-100 block"
                >
                  Search YapGrid...
                </Link>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Notification Bell */}
              {session?.user?.email && (
                <NotificationBell />
              )}

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <nav className="px-4 py-2 space-y-1">
              <Link
                href="/"
                className="w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <div className="w-full flex items-center gap-3 p-3 text-left rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                <TrendingUp className="w-5 h-5" />
                <span>Popular</span>
              </div>
              <Link
                href="/all"
                className="w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Globe className="w-5 h-5" />
                <span>All</span>
              </Link>
              <Link
                href="/videos"
                className="w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Video className="w-5 h-5" />
                <span>Videos</span>
              </Link>
              <Link
                href="/images"
                className="w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Image className="w-5 h-5" />
                <span>Images</span>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <MobileSearchOverlay 
          isOpen={isMobileSearchOpen}
          onClose={() => setIsMobileSearchOpen(false)}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Desktop Only */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              {/* Navigation Menu */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <nav className="space-y-1">
                  <Link
                    href="/"
                    className="w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Home</span>
                  </Link>
                  <div className="w-full flex items-center gap-3 p-2 text-left rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Popular</span>
                  </div>
                  <Link
                    href="/all"
                    className="w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Globe className="w-5 h-5" />
                    <span className="font-medium">All</span>
                  </Link>
                  <Link
                    href="/videos"
                    className="w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Video className="w-5 h-5" />
                    <span className="font-medium">Videos</span>
                  </Link>
                  <Link
                    href="/images"
                    className="w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Image className="w-5 h-5" />
                    <span className="font-medium">Images</span>
                  </Link>
                </nav>
              </div>

              {/* DISABLED: Personalized Communities - removed for better performance */}
              {/* <PersonalizedCommunities 
                algorithm={communitiesAlgorithm}
                onAlgorithmChange={handleCommunitiesAlgorithmChange}
              /> */}
            </div>
          </aside>

          {/* Main Feed */}
          <main className="flex-1 max-w-3xl">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Popular Posts</h1>
              <p className="text-gray-600 dark:text-gray-400">Most upvoted posts on YapGrid</p>
            </div>

            {/* Posts */}
            {loading && posts.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onDelete={handlePostDelete}
                    />
                  ))}
                </div>

                {/* Load More Sentinel */}
                <div ref={loadMoreSentinelRef} className="h-20 flex items-center justify-center">
                  {loadMoreLoading && (
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {!hasMore && posts.length > 0 && (
                    <p className="text-gray-500 dark:text-gray-400">No more posts to load</p>
                  )}
                </div>

                {posts.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No popular posts found</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

