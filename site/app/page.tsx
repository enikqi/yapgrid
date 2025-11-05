'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VideoModal } from '@/components/video/video-modal'
import { PostCard } from '@/components/post-card'
import { UserMenu } from '@/components/auth/user-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { MobileSearchOverlay } from '@/components/mobile-search-overlay'
import PersonalizedCommunities from '@/components/personalized-communities'
import { Toaster } from 'react-hot-toast'
import { toast } from 'react-hot-toast'
import type { Post, Asset, PaginatedResponse } from '@/lib/types'
import { Search, Bell, MessageCircle, Home, TrendingUp, Globe, Video, Image, Users, ChevronRight, HelpCircle, Flag, Heart, Zap, Sparkles, Smartphone, Bookmark, Clock, Settings, HelpCircle as Help, Edit3, Camera, Video as VideoIcon, UserPlus, UserMinus, Menu, X } from 'lucide-react'
import { Logo, SimpleLogo } from '@/components/logo'
import { useSession } from 'next-auth/react'

export default function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [posts, setPosts] = useState<(Post & { assets: Asset[] })[]>([])
  const [allPosts, setAllPosts] = useState<(Post & { assets: Asset[] })[]>([]) // Store all posts for search
  const [loading, setLoading] = useState(true)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedPost, setSelectedPost] = useState<(Post & { assets: Asset[] }) | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<(Post & { assets: Asset[] })[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchTotal, setSearchTotal] = useState(0)
  const [currentAlgorithm, setCurrentAlgorithm] = useState<'personal' | 'latest' | 'trending'>('latest')
  const [personalizedFeed, setPersonalizedFeed] = useState(true)
  const [communitiesAlgorithm, setCommunitiesAlgorithm] = useState<'trending' | 'popular' | 'hot'>('trending')
  
  // Sidebar menu state
  const [activeMenu, setActiveMenu] = useState('home')
  const [filteredPosts, setFilteredPosts] = useState<(Post & { assets: Asset[] })[]>([])
  const [isFiltering, setIsFiltering] = useState(false)
  


  // Subscription state
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set())
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Mobile search overlay state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)



  // Infinite scroll handler - load more posts when near bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Load more posts when near bottom (no visible range updates)
      if (scrollTop + windowHeight >= documentHeight - 1000 && hasMore && !loadMoreLoading) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadMoreLoading, loadMore])

  // Avoid preloading images to reduce initial network pressure
  const preloadImages = useCallback((_posts: (Post & { assets: Asset[] })[]) => {
    // intentionally no-op
  }, [])

  const fetchPosts = useCallback(async (pageNum: number, algorithm: 'personal' | 'latest' | 'trending' = 'latest') => {
    try {
      if (pageNum === 1) {
      setLoading(true)
      } else {
        setLoadMoreLoading(true)
      }
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '15', // Reduced from 20 to 15 for faster loading
        algo: algorithm,
        includeNsfw: 'false',
      })

      // Add hidden post IDs from localStorage for non-signed-in users
      const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]')
      if (hiddenPosts.length > 0) {
        params.append('hiddenPostIds', hiddenPosts.join(','))
      }

      const response = await fetch(`/api/recommendations?${params}`)
      const data = await response.json()

      if (data.success) {
        const paginatedData = data.data as PaginatedResponse<Post & { assets: Asset[] }>
        
        if (pageNum === 1) {
          setPosts(paginatedData.items)
          setAllPosts(paginatedData.items) // Store all posts for search
        } else {
          // Prevent duplicates by checking existing post IDs
          setPosts(prevPosts => {
            const existingIds = new Set(prevPosts.map(post => post.id))
            const newUniquePosts = paginatedData.items.filter(post => !existingIds.has(post.id))
            const combinedPosts = [...prevPosts, ...newUniquePosts]
            setAllPosts(combinedPosts) // Update all posts
            return combinedPosts
          })
        }
        
        setHasMore(paginatedData.hasMore)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
      setLoadMoreLoading(false)
    }
  }, [])

  // Search functionality using API
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    setIsSearching(query.length > 0)
    
    if (query.trim() === '') {
      setPosts(allPosts)
      setSearchResults([])
      setSearchPage(1)
      setSearchHasMore(false)
      return
    }

    try {
      const params = new URLSearchParams({
        q: query.toLowerCase(), // Convert to lowercase for case-insensitive search
        page: '1',
        pageSize: '15', // Reduced from 50 to 15 for faster loading
        includeNsfw: 'false'
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data.items)
        setSearchHasMore(data.data.hasMore)
        setSearchTotal(data.data.total)
        setSearchPage(1)
        setPosts(data.data.items) // Show search results
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
  }, [allPosts])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300) // 300ms delay for fast typing

    return () => clearTimeout(timeoutId)
  }, [searchQuery, handleSearch])

  // Initial load handled by the currentAlgorithm effect below to avoid duplicate calls

  useEffect(() => {
    // Reset everything when algorithm changes
    setPosts([])
    setAllPosts([])
    setPage(1)
    setHasMore(true)
    fetchPosts(1, currentAlgorithm)
  }, [currentAlgorithm, fetchPosts])

  // Fetch user subscriptions when user is authenticated with debouncing
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!session?.user?.email) return

      try {
        const response = await fetch('/api/subscriptions')
        const data = await response.json()
        
        if (data.success) {
          setSubscriptions(new Set(data.data.subscriptions))
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error)
      }
    }

    // Debounce subscription fetching
    const timeoutId = setTimeout(() => {
      fetchSubscriptions()
    }, 300) // Wait 300ms before fetching subscriptions

    return () => clearTimeout(timeoutId)
  }, [session])

  const handleJoinLeave = async (subreddit: string, isSubscribed: boolean) => {
    if (!session?.user?.email) {
      toast.error('Please sign in to join communities')
      return
    }

    const action = isSubscribed ? 'leave' : 'join'
    
    // Optimistic update - update UI immediately
    if (action === 'join') {
      setSubscriptions(prev => new Set([...prev, subreddit]))
    } else {
      setSubscriptions(prev => {
        const newSet = new Set(prev)
        newSet.delete(subreddit)
        return newSet
      })
    }
    
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subreddit,
          action
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${action === 'join' ? 'Joined' : 'Left'} r/${subreddit}`)
      } else {
        // Revert optimistic update on failure
        if (action === 'join') {
          setSubscriptions(prev => {
            const newSet = new Set(prev)
            newSet.delete(subreddit)
            return newSet
          })
        } else {
          setSubscriptions(prev => new Set([...prev, subreddit]))
        }
        toast.error(data.error || 'Failed to update subscription')
      }
    } catch (error) {
      // Revert optimistic update on error
      if (action === 'join') {
        setSubscriptions(prev => {
          const newSet = new Set(prev)
          newSet.delete(subreddit)
          return newSet
        })
      } else {
        setSubscriptions(prev => new Set([...prev, subreddit]))
      }
      console.error('Failed to update subscription:', error)
      toast.error('Failed to update subscription')
    }
  }

  const loadMore = useCallback(() => {
    if (!loading && !loadMoreLoading && hasMore && !isSearching && !isFiltering) {
      setPage(prevPage => {
        const nextPage = prevPage + 1
        fetchPosts(nextPage, currentAlgorithm)
        return nextPage
      })
    }
  }, [loading, loadMoreLoading, hasMore, fetchPosts, currentAlgorithm, isSearching, isFiltering])

  const loadMoreSearchResults = useCallback(async () => {
    if (!loading && searchHasMore && isSearching) {
      try {
        setLoading(true)
        const nextPage = searchPage + 1
        
        const params = new URLSearchParams({
          q: searchQuery.toLowerCase(), // Convert to lowercase for case-insensitive search
          page: nextPage.toString(),
          pageSize: '15', // Reduced from 50 to 15 for faster loading
          includeNsfw: 'false'
        })

        const response = await fetch(`/api/search?${params}`)
        const data = await response.json()

        if (data.success) {
          const newResults = [...searchResults, ...data.data.items]
          setSearchResults(newResults)
          setPosts(newResults)
          setSearchHasMore(data.data.hasMore)
          setSearchPage(nextPage)
        }
      } catch (error) {
        console.error('Load more search results error:', error)
      } finally {
        setLoading(false)
      }
    }
  }, [loading, searchHasMore, isSearching, searchPage, searchQuery, searchResults])

  // Handle sidebar menu filtering
  const handleCommunitiesAlgorithmChange = useCallback((algorithm: 'trending' | 'popular' | 'hot') => {
    setCommunitiesAlgorithm(algorithm)
  }, [])

  const handleMenuFilter = useCallback(async (menuType: string) => {
    setActiveMenu(menuType)
    setIsFiltering(true)
    setSearchQuery('') // Clear search when filtering
    
    try {
      let params = new URLSearchParams({
        page: '1',
        pageSize: '15', // Reduced from 50 to 15 for faster loading
        status: 'PUBLISHED',
        includeNsfw: 'false'
      })

      // Add specific filters based on menu type
      switch (menuType) {
        case 'home':
          // Default homepage - no additional filters
          break
        case 'popular':
          // Sort by score (most upvoted)
          params.append('sortBy', 'score')
          break
        case 'all':
          // Show all posts including NSFW
          params.set('includeNsfw', 'true')
          break
        case 'videos':
          // Only posts with video assets
          params.append('assetType', 'VIDEO')
          break
        case 'images':
          // Only posts with image/thumbnail assets
          params.append('assetType', 'THUMBNAIL')
          break
      }

      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()

      if (data.success) {
        setFilteredPosts(data.data.items)
        setPosts(data.data.items)
        setHasMore(data.data.hasMore)
        setPage(1)
      } else {
        console.error('Menu filter failed:', data.error)
        setFilteredPosts([])
        setPosts([])
      }
    } catch (error) {
      console.error('Menu filter error:', error)
      setFilteredPosts([])
      setPosts([])
    } finally {
      setIsFiltering(false)
    }
  }, [])

  const handlePostDelete = useCallback((postId: string) => {
    // Remove the post from all relevant state arrays
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
    setAllPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
    setFilteredPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
    setSearchResults(prevPosts => prevPosts.filter(post => post.id !== postId))
  }, [])

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "YapGrid",
    "alternateName": "YapGrid - The heart of the internet",
    "url": "https://yapgrid.com",
    "description": "YapGrid is where millions of people gather for conversations about the things they care about, in over 100000 subreddit communities.",
    "publisher": {
      "@type": "Organization",
      "name": "YapGrid",
      "url": "https://yapgrid.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://yapgrid.com/logo.png"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://yapgrid.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": "Popular Communities",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "r/confidentlyincorrect",
          "url": "https://yapgrid.com/r/confidentlyincorrect"
        },
        {
          "@type": "ListItem", 
          "position": 2,
          "name": "r/nextfuckinglevel",
          "url": "https://yapgrid.com/r/nextfuckinglevel"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "r/AskReddit", 
          "url": "https://yapgrid.com/r/AskReddit"
        }
      ]
    }
  }

  return (
    <>
      <Head>
        <title>YapGrid - The heart of the internet</title>
        <meta name="description" content="YapGrid is where millions of people gather for conversations about the things they care about, in over 100000 subreddit communities. Discover trending content, join discussions, and share your thoughts with the world." />
        <meta name="keywords" content="reddit, social media, content, discovery, community, discussions, trending, posts, videos, images, subreddit, communities, social network, user generated content, memes, news, entertainment, technology, gaming" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yapgrid.com/" />
        <meta property="og:title" content="YapGrid - The heart of the internet" />
        <meta property="og:description" content="YapGrid is where millions of people gather for conversations about the things they care about, in over 100000 subreddit communities." />
        <meta property="og:image" content="https://yapgrid.com/og-image.jpg" />
        <meta property="og:site_name" content="YapGrid" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://yapgrid.com/" />
        <meta property="twitter:title" content="YapGrid - The heart of the internet" />
        <meta property="twitter:description" content="YapGrid is where millions of people gather for conversations about the things they care about, in over 100000 subreddit communities." />
        <meta property="twitter:image" content="https://yapgrid.com/twitter-image.jpg" />
        
        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="YapGrid Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://yapgrid.com/" />
      </Head>
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 overflow-x-hidden">
        {/* Reddit-style Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
            {/* Left side: Menu + Logo + Desktop Nav */}
            <div className="flex items-center gap-2 xl:gap-4 flex-shrink-0">
              {/* Mobile menu button - before logo on mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              <SimpleLogo size="md" />
              
              <nav className="hidden xl:flex items-center gap-6">
                <a href="/" className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-orange-500">
                  Home
                </a>
                {(session?.user as any)?.isAdmin && (
                  <a href="/admin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                    Admin
                  </a>
                )}
              </nav>
            </div>

            {/* Desktop Search bar */}
            <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search YapGrid"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 pr-8 sm:pr-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Right side: Icons - Desktop shows all, Mobile shows in specific order */}
            {/* Desktop Layout: Search (hidden) + Bell + Chat + UserMenu */}
            {/* Mobile Layout: Log In (if not logged) + Search + Bell + Chat + UserMenu */}
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Desktop: Log In button (only if not logged in) */}
              {!session?.user && (
                <Link
                  href="/auth/signin"
                  className="hidden md:block bg-orange-500 text-white px-5 py-1.5 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors whitespace-nowrap"
                >
                  Log In
                </Link>
              )}

              {/* Mobile/Desktop: Search button */}
              <button 
                onClick={() => setIsMobileSearchOpen(true)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Notification Bell with Dropdown */}
              <NotificationBell />

              {/* Chat Icon - Desktop only */}
              <button 
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer hidden sm:block"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* UserMenu - Same on all screen sizes */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Mobile Search Overlay */}
        <MobileSearchOverlay
          isOpen={isMobileSearchOpen}
          onClose={() => setIsMobileSearchOpen(false)}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="fixed top-0 left-0 h-full w-72 max-w-[80vw] bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <SimpleLogo size="sm" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Menu Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Navigation */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Navigation</h3>
                    <nav className="space-y-1">
                      <button 
                        onClick={() => {
                          handleMenuFilter('home')
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${
                          activeMenu === 'home' 
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Home</span>
                      </button>
                      <button 
                        onClick={() => {
                          handleMenuFilter('popular')
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${
                          activeMenu === 'popular' 
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-medium">Popular</span>
                      </button>
                      <button 
                        onClick={() => {
                          handleMenuFilter('all')
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${
                          activeMenu === 'all' 
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Globe className="w-5 h-5" />
                        <span className="font-medium">All</span>
                      </button>
                      <button 
                        onClick={() => {
                          handleMenuFilter('videos')
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${
                          activeMenu === 'videos' 
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Video className="w-5 h-5" />
                        <span className="font-medium">Videos</span>
                      </button>
                      <button 
                        onClick={() => {
                          handleMenuFilter('images')
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${
                          activeMenu === 'images' 
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Image className="w-5 h-5" />
                        <span className="font-medium">Images</span>
                      </button>
                    </nav>
                  </div>
                  
                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <Link 
                        href="/submit"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Create Post
                      </Link>
                      <Link 
                        href="/communities/create"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Create Community
                      </Link>
                    </div>
                  </div>
                  
                  {/* Admin Link */}
                  {(session?.user as any)?.isAdmin && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Admin</h3>
                      <a 
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Admin Panel</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content with sidebars */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col xl:flex-row gap-4 xl:gap-6">
            {/* Left Sidebar - Hidden on mobile */}
            <aside className="hidden xl:block w-full xl:w-64 space-y-4 order-2 xl:order-1">
              {/* Navigation */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <nav className="space-y-1">
                  <button 
                    onClick={() => handleMenuFilter('home')}
                    className={`w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors cursor-pointer ${
                      activeMenu === 'home' 
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Home</span>
                  </button>
                  <button 
                    onClick={() => handleMenuFilter('popular')}
                    className={`w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors cursor-pointer ${
                      activeMenu === 'popular' 
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Popular</span>
                  </button>
                  <button 
                    onClick={() => handleMenuFilter('all')}
                    className={`w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors cursor-pointer ${
                      activeMenu === 'all' 
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Globe className="w-5 h-5" />
                    <span className="font-medium">All</span>
                  </button>
                  <button 
                    onClick={() => handleMenuFilter('videos')}
                    className={`w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors cursor-pointer ${
                      activeMenu === 'videos' 
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    <span className="font-medium">Videos</span>
                  </button>
                  <button 
                    onClick={() => handleMenuFilter('images')}
                    className={`w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors cursor-pointer ${
                      activeMenu === 'images' 
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Image className="w-5 h-5" />
                    <span className="font-medium">Images</span>
                  </button>
                </nav>
              </div>

              {/* Personalized Communities */}
              <PersonalizedCommunities 
                algorithm={communitiesAlgorithm} 
                limit={6} 
                onAlgorithmChange={handleCommunitiesAlgorithmChange}
              />

              {/* User Profile */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">U</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">u/User</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">1 karma</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link 
                    href="/submit"
                    className="w-full bg-orange-500 text-white py-2 px-3 rounded-full hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Create Post
                  </Link>
                  <Link 
                    href="/communities/create"
                    className="w-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Create Community
                  </Link>
                </div>
              </div>

              {/* Shortcuts */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Shortcuts</h3>
                <div className="space-y-1">
                  {session?.user?.email ? (
                    // Authenticated user shortcuts
                    [
                      { name: 'Saved', icon: Bookmark, href: '/saved' },
                      { name: 'History', icon: Clock, href: '/history' },
                      { name: 'Settings', icon: Settings, href: '/settings' },
                      { name: 'Help', icon: Help, href: '/help' }
                    ].map((shortcut) => (
                      <Link key={shortcut.name} href={shortcut.href} className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <shortcut.icon className="w-5 h-5 text-orange-500" />
                        <span className="text-sm">{shortcut.name}</span>
                      </Link>
                    ))
                  ) : (
                    // Non-authenticated user shortcuts
                    [
                      { name: 'Settings', icon: Settings, href: '/settings' },
                      { name: 'Help', icon: Help, href: '/help' }
                    ].map((shortcut) => (
                      <Link key={shortcut.name} href={shortcut.href} className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <shortcut.icon className="w-5 h-5 text-orange-500" />
                        <span className="text-sm">{shortcut.name}</span>
                      </Link>
                    ))
                  )}
                  
                  {!session?.user?.email && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Sign in to access saved posts and history
                      </p>
                      <Link
                        href="/auth/signin"
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <Bookmark className="w-4 h-4" />
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Posts feed - Full width on mobile */}
            <main className="flex-1 w-full max-w-full mx-auto xl:max-w-2xl xl:mx-0 order-1 xl:order-2">
              {/* Algorithm Toggle Controls */}
              <div className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Feed:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentAlgorithm('personal')
                          setPage(1)
                          setPosts([]) // Clear posts to prevent stale data
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          currentAlgorithm === 'personal'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        Personal
                      </button>
                      <button
                        onClick={() => {
                          setCurrentAlgorithm('latest')
                          setPage(1)
                          setPosts([]) // Clear posts to prevent stale data
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          currentAlgorithm === 'latest'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        Latest
                      </button>
                      <button
                        onClick={() => {
                          setCurrentAlgorithm('trending')
                          setPage(1)
                          setPosts([]) // Clear posts to prevent stale data
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          currentAlgorithm === 'trending'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        Trending
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={personalizedFeed}
                        onChange={(e) => setPersonalizedFeed(e.target.checked)}
                        className="w-3 h-3 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      Personalized
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {(isSearching ? searchResults : posts).map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onVideoPlay={setSelectedPost}
                    onPostDelete={handlePostDelete}
                    showPlayButton={true}
                  />
                ))}
              </div>

              {/* Load more button */}
              {!isSearching && !isFiltering && hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={loadMore}
                    disabled={loading || loadMoreLoading}
                    className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadMoreLoading ? 'Loading...' : 'Load More Posts'}
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
                    Found {searchTotal} result{searchTotal !== 1 ? 's' : ''} for "{searchQuery}" (showing {posts.length})
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 px-4 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {/* Filter info */}
              {isFiltering && !isSearching && (
                <div className="text-center mt-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    Showing {activeMenu === 'home' ? 'Home' : 
                             activeMenu === 'popular' ? 'Popular' :
                             activeMenu === 'all' ? 'All Posts' :
                             activeMenu === 'videos' ? 'Videos' :
                             activeMenu === 'images' ? 'Images' : 'Filtered'} posts ({posts.length})
                  </p>
                </div>
              )}

              {/* Loading indicator */}
              {loading && posts.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Loading posts...</p>
                </div>
              )}
        </main>

            {/* Right Sidebar - Hidden on mobile */}
            <aside className="hidden lg:block w-full xl:w-64 space-y-4 order-3 xl:order-3">
              {/* Premium */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <SimpleLogo size="sm" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Take YapGrid to the next level with Premium features
                </p>
                <button className="w-full bg-orange-500 text-white py-2 px-4 rounded-full hover:bg-orange-600 transition-colors text-sm font-medium cursor-pointer">
                  Try YapGrid Premium
                </button>
              </div>

              {/* Popular Communities */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Popular Communities</h3>
                  <Link href="/communities" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
                    See all
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'confidentlyincorrect', members: '2.1M', icon: HelpCircle },
                    { name: 'ShitAmericansSay', members: '1.8M', icon: Flag },
                    { name: 'Nicegirls', members: '1.2M', icon: Heart },
                    { name: 'nextfuckinglevel', members: '3.4M', icon: Zap },
                    { name: 'blackmagicfuckery', members: '1.9M', icon: Sparkles },
                    { name: 'TikTokCringe', members: '2.7M', icon: Smartphone }
                  ].map((community) => {
                    const isSubscribed = subscriptions.has(community.name)
                    
                    return (
                      <div key={community.name} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <Link href={`/r/${community.name}`} className="flex items-center gap-2 flex-1">
                          <community.icon className="w-5 h-5 text-orange-500" />
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">r/{community.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{community.members} members</div>
                          </div>
                        </Link>
                        
                        {/* Join/Leave Button */}
                        {session?.user?.email ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleJoinLeave(community.name, isSubscribed)
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              isSubscribed
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                          >
                            {isSubscribed ? (
                              <>
                                <UserMinus className="w-3 h-3" />
                                Leave
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                Join
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => toast.error('Please sign in to join communities')}
                            className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Trending Today</h3>
                <div className="space-y-2">
                  {[
                    { topic: 'AI Technology', posts: '12.3k posts' },
                    { topic: 'Space Exploration', posts: '8.7k posts' },
                    { topic: 'Climate Change', posts: '15.2k posts' },
                    { topic: 'Gaming News', posts: '9.8k posts' },
                    { topic: 'Movie Reviews', posts: '6.4k posts' }
                  ].map((trend, index) => (
                    <div key={trend.topic} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-orange-500 font-bold text-sm">#{index + 1}</span>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{trend.topic}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{trend.posts}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create Post */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Create a Post</h3>
                <div className="space-y-2">
                  <Link 
                    href="/submit"
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-full hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    Create Post
                  </Link>
                  <Link 
                    href="/submit?type=image"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Upload Image
                  </Link>
                  <Link 
                    href="/submit?type=video"
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-full hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <VideoIcon className="w-4 h-4" />
                    Upload Video
                  </Link>
                </div>
              </div>

              {/* Footer - Reddit Style */}
              <footer className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Useful Links</div>
                    <div className="flex flex-col gap-1">
                      <a href="/help" className="hover:text-orange-500 transition-colors">Help Center</a>
                      <a href="/about" className="hover:text-orange-500 transition-colors">About</a>
                      <a href="/careers" className="hover:text-orange-500 transition-colors">Careers</a>
                      <a href="/blog" className="hover:text-orange-500 transition-colors">Blog</a>
                      <a href="/brand-resources" className="hover:text-orange-500 transition-colors">Brand Assets</a>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Support</div>
                    <div className="flex flex-col gap-1">
                      <a href="/premium" className="hover:text-orange-500 transition-colors">YapGrid Premium</a>
                      <a href="/contact" className="hover:text-orange-500 transition-colors">Contact Us</a>
                      <a href="/communities" className="hover:text-orange-500 transition-colors">Communities</a>
                      <a href="/trending" className="hover:text-orange-500 transition-colors">Trending</a>
                      <a href="/modhelp" className="hover:text-orange-500 transition-colors">Moderator Help</a>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <a href="/content-policy" className="hover:text-orange-500 transition-colors">Content Policy</a>
                    <a href="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
                    <a href="/terms" className="hover:text-orange-500 transition-colors">User Agreement</a>
                    <a href="/cookies" className="hover:text-orange-500 transition-colors">Cookie Notice</a>
                  </div>
                  <div className="mt-3">
                    <SimpleLogo size="sm" />
                    <p className="mt-2 text-gray-400 dark:text-gray-500">© 2024 YapGrid. All rights reserved.</p>
                  </div>
                </div>
              </footer>
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

      {/* Toast notifications */}
      <Toaster position="bottom-center" />
    </>
  )
}