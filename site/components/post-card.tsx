'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, ArrowDown, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, BookmarkCheck, Trash2, Flag, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useEventTracker } from '@/lib/event-tracker'
import { formatNumber } from '@/lib/utils'
import CommentSection from './comment-section'
import AutoPlayVideo from './auto-play-video'
import { ImageModal } from './image-modal'
import type { Post, Asset } from '@/lib/types'

interface PostCardProps {
  post: Post & { assets: Asset[] }
  onVideoPlay?: (post: Post & { assets: Asset[] }) => void
  onPostDelete?: (postId: string) => void
  showPlayButton?: boolean // New prop to control play button visibility
  isFullPage?: boolean // For individual post pages
  isCompact?: boolean // For grid layouts
}

export function PostCard({ post, onVideoPlay, onPostDelete, showPlayButton = true, isFullPage = false, isCompact = false }: PostCardProps) {
  const { data: session } = useSession()
  const { trackEvent } = useEventTracker()
  const [isUpvoted, setIsUpvoted] = useState(false)
  const [isDownvoted, setIsDownvoted] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isHiding, setIsHiding] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const impressionTracked = useRef(false)

  // Track post view for history and impressions with debouncing
  useEffect(() => {
    // Track impression
    if (!impressionTracked.current) {
      trackEvent({
        type: 'impression',
        postId: post.id,
        metadata: {
          subreddit: post.subreddit,
          author: post.author
        }
      })
      impressionTracked.current = true
    }

    // Add to history for signed-in users with debouncing
    if (session?.user?.email) {
      const timeoutId = setTimeout(() => {
        fetch('/api/post-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId: post.id })
        }).catch(error => {
          console.error('Failed to add to history:', error)
        })
      }, 2000) // Increased to 2 seconds to reduce API calls

      return () => clearTimeout(timeoutId)
    }
  }, [post.id, post.subreddit, post.author, session?.user?.email, trackEvent])

  // Load user's vote status with debouncing
  useEffect(() => {
    if (session?.user?.email) {
      const timeoutId = setTimeout(() => {
        fetch(`/api/votes?postId=${post.id}`)
          .then(response => {
            if (!response.ok) {
              // Don't throw error for 401/403 - user might not be logged in
              if (response.status === 401 || response.status === 403) {
                return { success: false, voteType: null }
              }
              throw new Error(`HTTP ${response.status}`)
            }
            return response.json()
          })
          .then(data => {
            if (data.success) {
              setIsUpvoted(data.voteType === 'upvote')
              setIsDownvoted(data.voteType === 'downvote')
            }
          })
          .catch(error => {
            console.error('Failed to load vote status:', error)
            // Silently fail - vote buttons will still work
          })
      }, 1000) // Increased to 1 second to reduce API calls

      return () => clearTimeout(timeoutId)
    }
  }, [post.id, session?.user?.email])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleUpvote = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to vote')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId: post.id, 
          voteType: 'upvote' 
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        if (data.action === 'removed') {
          setIsUpvoted(false)
          setIsDownvoted(false)
        } else if (data.action === 'changed') {
          setIsUpvoted(true)
          setIsDownvoted(false)
        } else {
          setIsUpvoted(true)
          setIsDownvoted(false)
        }

        // Update post score in UI
        post.score = data.newScore

        // Track vote event
        trackEvent({
          type: 'vote',
          postId: post.id,
          metadata: {
            subreddit: post.subreddit,
            author: post.author,
            action: data.action,
            voteType: data.voteType
          }
        })

        toast.success(data.action === 'removed' ? 'Upvote removed' : 'Upvoted!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownvote = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to vote')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId: post.id, 
          voteType: 'downvote' 
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        if (data.action === 'removed') {
          setIsUpvoted(false)
          setIsDownvoted(false)
        } else if (data.action === 'changed') {
          setIsUpvoted(false)
          setIsDownvoted(true)
        } else {
          setIsUpvoted(false)
          setIsDownvoted(true)
        }

        // Update post score in UI
        post.score = data.newScore

        // Track vote event
        trackEvent({
          type: 'vote',
          postId: post.id,
          metadata: {
            subreddit: post.subreddit,
            author: post.author,
            action: data.action,
            voteType: data.voteType
          }
        })

        toast.success(data.action === 'removed' ? 'Downvote removed' : 'Downvoted!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookmark = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to save posts')
      return
    }

    setIsLoading(true)
    try {
      if (isBookmarked) {
        // Remove from saved
        const response = await fetch('/api/saved-posts', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId: post.id })
        })
        
        if (response.ok) {
          setIsBookmarked(false)
          toast.success('Removed from saved posts')
          
          // Track unsave event
          trackEvent({
            type: 'save',
            postId: post.id,
            metadata: {
              subreddit: post.subreddit,
              author: post.author,
              action: 'unsave'
            }
          })
        } else {
          toast.error('Failed to remove from saved posts')
        }
      } else {
        // Add to saved
        const response = await fetch('/api/saved-posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId: post.id })
        })
        
        if (response.ok) {
          setIsBookmarked(true)
          toast.success('Post saved!')
          
          // Track save event
          trackEvent({
            type: 'save',
            postId: post.id,
            metadata: {
              subreddit: post.subreddit,
              author: post.author,
              action: 'save'
            }
          })
        } else {
          toast.error('Failed to save post')
        }
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Failed to save post')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to delete posts')
      return
    }

    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setShowDropdown(false)

    try {
      const response = await fetch('/api/posts/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id })
      })

      if (response.ok) {
        toast.success('Post deleted successfully')
        // Call the parent callback to remove the post from the list
        if (onPostDelete) {
          onPostDelete(post.id)
        }
        
        // Force refresh to update UI immediately
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleHide = async () => {
    setIsHiding(true)
    setShowDropdown(false) // Close dropdown immediately

    try {
      // If user is signed in, use the API
      if (session?.user?.email) {
        const response = await fetch('/api/posts/hide', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId: post.id })
        })

        if (response.ok) {
          setIsHidden(true)
          toast.success('Post hidden successfully')
          
          // Force refresh to update UI immediately
          setTimeout(() => {
            window.location.reload()
          }, 1000)
          
          // Track hide event
          trackEvent({
            type: 'hide',
            postId: post.id,
            metadata: {
              subreddit: post.subreddit,
              author: post.author
            }
          })
          
          // Call the parent callback to remove the post from the list
          if (onPostDelete) {
            onPostDelete(post.id)
          }
        } else {
          const data = await response.json()
          toast.error(data.error || 'Failed to hide post')
        }
      } else {
        // For non-signed-in users, use localStorage
        const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]')
        if (!hiddenPosts.includes(post.id)) {
          hiddenPosts.push(post.id)
          localStorage.setItem('hiddenPosts', JSON.stringify(hiddenPosts))
        }
        
        setIsHidden(true)
          toast.success('Post hidden successfully')
        
        // Track hide event
        trackEvent({
          type: 'hide',
          postId: post.id,
          metadata: {
            subreddit: post.subreddit,
            author: post.author
          }
        })
        
        // Call the parent callback to remove the post from the list
        if (onPostDelete) {
          onPostDelete(post.id)
        }
      }
    } catch (error) {
      console.error('Error hiding post:', error)
      toast.error('Failed to hide post')
    } finally {
      setIsHiding(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: `https://yapgrid.com/posts/${post.id}`, // Use internal link instead of Reddit
      })
    } else {
      navigator.clipboard.writeText(`https://yapgrid.com/posts/${post.id}`) // Use internal link
      toast.success('Link copied to clipboard!')
    }
  }

  // Determine primary asset (video takes priority, then thumbnail, then any asset)
  const videoAsset = post.assets.find(a => a.type === 'VIDEO')
  const thumbnailAsset = post.assets.find(a => a.type === 'THUMBNAIL')
  const primaryAsset = videoAsset || thumbnailAsset || post.assets[0]
  
  // Determine if this post has a video
  const hasVideo = !!videoAsset
  
  // For display: if has video, use video (AutoPlayVideo will handle thumbnail)
  // If no video, use thumbnail or first asset
  const displayAsset = hasVideo ? videoAsset : (thumbnailAsset || post.assets[0])

  // Memoize date formatting to avoid hydration errors
  const formatDateTitle = (date: Date | string | number) => {
    if (!date) return ''
    try {
      const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return ''
      return dateObj.toISOString() // Use ISO string for consistent formatting
    } catch {
      return ''
    }
  }

  const formatTimeAgo = (date: Date | string | number) => {
    // Handle different date formats
    let timestamp: number
    if (typeof date === 'string') {
      timestamp = new Date(date).getTime() / 1000
    } else if (date instanceof Date) {
      timestamp = date.getTime() / 1000
    } else {
      timestamp = date
    }
    
    // If timestamp is invalid, return 'unknown'
    if (isNaN(timestamp) || timestamp <= 0) {
      return 'unknown'
    }
    
    const now = Date.now() / 1000
    const diff = now - timestamp
    
    // If diff is negative (future date), return 'now'
    if (diff < 0) {
      return 'now'
    }
    
    const days = Math.floor(diff / 86400)
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor(diff / 60)

    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    if (minutes > 0) return `${minutes}m`
    return 'now'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative z-10">
      {/* Post Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span className="font-medium text-orange-500">r/{post.subreddit}</span>
          <span>•</span>
          <span>Posted by u/{post.author}</span>
          <span>•</span>
          <span title={formatDateTitle(post.publishedAt || post.createdUtc)}>
            {formatTimeAgo(post.publishedAt || post.createdUtc)}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          <a 
            href={`/posts/${post.id}`}
            className="hover:text-orange-500 transition-colors duration-200 cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = `/posts/${post.id}`
            }}
          >
            {post.title}
          </a>
        </h2>
      </div>

      {/* Media Content */}
      {post.assets.length > 0 && (
        <div
          className="relative w-full bg-black"
          style={{
            aspectRatio:
              (displayAsset as any)?.width && (displayAsset as any)?.height
                ? `${(displayAsset as any).width}/${(displayAsset as any).height}`
                : '16/9',
          }}
        >
          {hasVideo ? (
            // Render video player for posts with video assets
            <div className="absolute inset-0">
              <AutoPlayVideo
                post={post}
                onVideoPlay={onVideoPlay || (() => {})}
                showPlayButton={showPlayButton}
                className="w-full h-full"
              />
            </div>
          ) : displayAsset?.url ? (
            // Render simple image for posts with only images
            <div className="absolute inset-0">
              <img
                src={displayAsset.url}
                alt={post.title}
                className="w-full h-full object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  // Open image in modal
                  setShowImageModal(true)
                }}
                onError={(e) => {
                  // Fallback if image doesn't load
                  console.error('Image failed to load:', displayAsset.url)
                }}
                loading="lazy"
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Post Actions */}
      <div className="p-4 pt-2">
        <div className="flex items-center gap-4">
          {/* Vote buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUpvote}
              disabled={isLoading}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 cursor-pointer ${
                isUpvoted ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[24px] text-center px-2">
              {formatNumber(post.score)}
            </span>
            <button
              onClick={handleDownvote}
              disabled={isLoading}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 cursor-pointer ${
                isDownvoted ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>

          {/* Comments */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comments</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            disabled={isLoading}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 cursor-pointer ${
              isBookmarked ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>

          {/* More options */}
          <div className="relative z-[9998]" ref={dropdownRef}>
            <button 
              ref={buttonRef}
              onClick={() => {
                if (buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect()
                  setDropdownPosition({
                    top: rect.bottom + 8,
                    left: rect.right - 192 // 192px is the width of the dropdown
                  })
                }
                setShowDropdown(!showDropdown)
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && createPortal(
              <div 
                className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[9999]"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`
                }}
              >
                <div className="py-1">
                  {/* Hide Post */}
                  <button
                    onClick={handleHide}
                    disabled={isHiding}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <EyeOff className="w-4 h-4" />
                    {isHiding ? 'Hiding...' : 'Hide post'}
                  </button>

                  {/* Report Post */}
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      toast.info('Report functionality coming soon!')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <Flag className="w-4 h-4" />
                    Report post
                  </button>

                  {/* Delete Post - Only show if user is signed in */}
                  {session?.user?.email && (
                    <>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? 'Deleting...' : 'Delete post'}
                      </button>
                    </>
                  )}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection postId={post.id} />
      )}

      {/* Image Modal */}
      {displayAsset?.url && (
        <ImageModal
          isOpen={showImageModal}
          imageUrl={displayAsset.url}
          title={post.title}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  )
}
