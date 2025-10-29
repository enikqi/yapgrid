'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Image, Video, Clock } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from './logo'
import type { Post, Asset } from '@/lib/types'

interface MobileSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
}

export function MobileSearchOverlay({ isOpen, onClose, searchQuery, onSearchQueryChange }: MobileSearchOverlayProps) {
  const [results, setResults] = useState<(Post & { assets: Asset[] })[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!isOpen) return

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Reset results if query is cleared
    if (searchQuery.trim() === '') {
      setResults([])
      setHasSearched(false)
      return
    }

    // Set loading state
    setLoading(true)
    setHasSearched(true)

    // Debounce search by 300ms
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&pageSize=10&includeNsfw=false`)
        
        if (!response.ok) {
          console.error('Search failed:', response.status)
          setResults([])
          setLoading(false)
          return
        }
        
        const data = await response.json()
        
        if (data.success && data.data) {
          // Debug: Check first result
          if (data.data.items && data.data.items.length > 0) {
            console.log('First result from search:', data.data.items[0])
            console.log('First result assets:', data.data.items[0].assets)
          }
          setResults(data.data.items || [])
        } else {
          setResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery, isOpen])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const handleClose = () => {
    onClose()
    setResults([])
    onSearchQueryChange('')
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={handleClose}
          />
          
          {/* Search Panel - slides from left */}
          <div className="fixed top-0 left-0 h-full w-full bg-white dark:bg-gray-900 shadow-xl" style={{ animation: 'slideInFromLeft 0.3s ease-out' }}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <SimpleLogo size="sm" />
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="px-4 pt-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search YapGrid"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    className="w-full px-4 py-3 pl-10 pr-10 bg-gray-100 dark:bg-gray-800 border-2 border-orange-500 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchQueryChange('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Searching...</p>
                  </div>
                ) : !hasSearched ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start typing to search posts...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((post) => {
                      // Try to find thumbnail in this order:
                      // 1. Asset with type 'THUMBNAIL'
                      // 2. Preview field from post (Reddit's preview image)
                      // 3. Any non-VIDEO, non-AUDIO asset
                      const thumbnailAsset = post.assets.find(a => a.type === 'THUMBNAIL')
                      const videoAsset = post.assets.find(a => a.type === 'VIDEO')
                      const anyImageAsset = post.assets.find(a => a.type !== 'VIDEO' && a.type !== 'AUDIO')
                      
                      // Try to get preview image from post metadata
                      let previewImage: string | null = null
                      try {
                        // Check if preview is directly a URL
                        if ((post as any).preview) {
                          if (typeof (post as any).preview === 'string') {
                            // Check if it's a URL
                            if ((post as any).preview.startsWith('http://') || (post as any).preview.startsWith('https://')) {
                              previewImage = (post as any).preview
                            } else {
                              // Try to parse as JSON
                              try {
                                const preview = JSON.parse((post as any).preview)
                                if (preview?.images?.[0]?.source?.url) {
                                  previewImage = preview.images[0].source.url
                                    .replace(/&amp;/g, '&')
                                    .replace(/preview\.redd\.it/, 'i.redd.it')
                                }
                              } catch {
                                // Not valid JSON, ignore
                              }
                            }
                          }
                          // Try as already parsed object
                          else if (typeof (post as any).preview === 'object') {
                            const preview = (post as any).preview
                            if (preview?.images?.[0]?.source?.url) {
                              previewImage = preview.images[0].source.url
                                .replace(/&amp;/g, '&')
                                .replace(/preview\.redd\.it/, 'i.redd.it')
                            }
                          }
                        }
                      } catch (e) {
                        console.error('Preview parse error:', e)
                      }
                      
                      // Debug log for video posts
                      if (videoAsset) {
                        console.log('=== VIDEO POST DEBUG ===')
                        console.log('Post ID:', post.id)
                        console.log('Title:', post.title)
                        console.log('All assets:', post.assets)
                        console.log('thumbnailAsset:', thumbnailAsset)
                        console.log('anyImageAsset:', anyImageAsset)
                        console.log('previewImage:', previewImage)
                        console.log('preview metadata:', (post as any).preview)
                      }
                      
                      // Get thumbnail URL - try multiple approaches
                      let thumbnailUrl: string | null = null
                      let foundAsset = null
                      
                      // Priority: THUMBNAIL > preview image > any other non-video asset
                      foundAsset = thumbnailAsset || anyImageAsset
                      
                      if (foundAsset) {
                        // First try direct URL
                        if (foundAsset.url) {
                          // Check if URL is absolute or relative
                          if (foundAsset.url.startsWith('http://') || foundAsset.url.startsWith('https://')) {
                            thumbnailUrl = foundAsset.url
                          } else if (foundAsset.url.startsWith('/media/')) {
                            // Convert /media/filename.png to /api/media/filename.png
                            const filename = foundAsset.url.replace('/media/', '')
                            thumbnailUrl = `/api/media/${filename}`
                          } else {
                            thumbnailUrl = foundAsset.url
                          }
                        } 
                        // Then try pathOrKey
                        else if (foundAsset.pathOrKey) {
                          thumbnailUrl = `/api/media/${foundAsset.pathOrKey}`
                        }
                      }
                      
                      // If no thumbnail asset found but there's a preview image, use it
                      // This is especially useful for videos that don't have thumbnail assets
                      if (!thumbnailUrl && previewImage) {
                        thumbnailUrl = previewImage
                      }
                      
                      console.log('Final thumbnailUrl for post', post.id, ':', thumbnailUrl)
                      
                      return (
                        <Link 
                          key={post.id} 
                          href={`/post/${post.id}`}
                          onClick={handleClose}
                          className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex gap-3">
                            {/* Thumbnail */}
                            {thumbnailUrl ? (
                              <>
                                {/* Debug badge */}
                                <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                                  <img
                                    src={thumbnailUrl}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      console.error('Image failed to load:', thumbnailUrl)
                                    }}
                                  />
                                  {/* Play button overlay for videos */}
                                  {videoAsset && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                        <Video className="w-5 h-5 text-orange-500 ml-0.5" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded flex items-center justify-center flex-shrink-0">
                                {videoAsset ? (
                                  <Video className="w-8 h-8 text-orange-500" />
                                ) : (
                                  <Image className="w-8 h-8 text-orange-500" />
                                )}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              {/* Post Type Icon */}
                              <div className="flex items-center gap-2 mb-1">
                                {videoAsset ? (
                                  <Video className="w-3 h-3 text-gray-400" />
                                ) : (
                                  <Image className="w-3 h-3 text-gray-400" />
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">r/{post.subreddit}</span>
                              </div>

                              {/* Title */}
                              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                                {post.title}
                              </h3>

                              {/* Metadata */}
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(post.publishedAt || post.createdUtc)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

