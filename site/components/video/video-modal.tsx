'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Maximize, Share2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Post, Asset } from '@/lib/types'
import { AdvancedVideoPlayer } from './advanced-video-player'
import { useRouter } from 'next/navigation'

interface VideoModalProps {
  post: Post & { assets: Asset[] }
  isOpen: boolean
  onClose: () => void
}

// Helper function to get video URL from asset with proper storage handling
function getVideoUrl(asset: { url?: string | null; pathOrKey?: string | null; storage?: string } | null | undefined): string {
  if (!asset) return ''
  
  try {
    // Use the asset URL if it's already set and valid
    if (asset.url) {
      // If it's already an absolute URL, return as is
      if (asset.url.startsWith('http://') || asset.url.startsWith('https://')) {
        return asset.url
      }
      
      // If it's a Reddit video URL, return as is
      if (asset.url.includes('v.redd.it') || asset.url.includes('reddit.com')) {
        return asset.url
      }
      
      // If it's already /api/media/..., return as is
      if (asset.url.startsWith('/api/media/')) {
        return asset.url
      }
      
      // Convert /media/... to /api/media/... for proper serving
      if (asset.url.startsWith('/media/')) {
        return `/api${asset.url}`
      }
    }

    // Fallback: Use pathOrKey if URL is not available
    if (asset.pathOrKey) {
      // For LOCAL storage, serve via /api/media/
      if (asset.storage === 'LOCAL') {
        // Extract filename from path
        const filename = asset.pathOrKey.split(/[/\\]/).pop() || asset.pathOrKey
        return `/api/media/${encodeURIComponent(filename)}`
      }
      
      // For S3 storage, we need to get signed URL (handled by API)
      if (asset.storage === 'S3') {
        return `/api/media/${encodeURIComponent(asset.pathOrKey)}`
      }
      
      // Default: treat as filename
      return `/api/media/${encodeURIComponent(asset.pathOrKey)}`
    }

    return ''
  } catch (err) {
    console.error('Error getting video URL:', err, asset)
    return ''
  }
}

export function VideoModal({ post, isOpen, onClose }: VideoModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const video = post.assets.find(a => a.type === 'VIDEO')
  const thumbnail = post.assets.find(a => a.type === 'THUMBNAIL')
  const videoUrl = video ? getVideoUrl(video) : ''

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleImageDoubleClick = () => {
    if (imageZoom === 1) {
      setImageZoom(2)
    } else {
      setImageZoom(1)
      setImagePosition({ x: 0, y: 0 })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageZoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageZoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (!isOpen) return null

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden",
          isFullscreen && 'max-w-none max-h-none w-screen h-screen rounded-none'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {video ? (
          <AdvancedVideoPlayer
            src={videoUrl}
            poster={thumbnail?.url || undefined}
            autoPlay
            loop
            muted={false}
            className="w-full h-full"
            onEnded={() => {
              // Reset to start when video ends
              if (containerRef.current) {
                const video = containerRef.current.querySelector('video')
                if (video) {
                  video.currentTime = 0
                }
              }
            }}
          />
        ) : thumbnail ? (
          <>
            <img
              src={thumbnail.url || ''}
              alt={post.title}
              className={cn(
                imageZoom === 2 ? "cursor-grab" : "cursor-pointer",
                isDragging && "cursor-grabbing"
              )}
              style={{
                width: '100%',
                height: isFullscreen ? '100%' : 'auto',
                maxWidth: '100%',
                maxHeight: isFullscreen ? '100%' : '80vh',
                objectFit: 'contain',
                transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.3s ease-in-out'
              }}
              onDoubleClick={handleImageDoubleClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
            
            {/* Image Controls - Always visible */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center justify-center gap-4">
                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-gray-300 transition-colors bg-gray-600 px-4 py-2 rounded cursor-pointer"
                  aria-label="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>

                {/* Actions */}
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: post.title,
                        url: `https://reddit.com${post.permalink}`,
                      })
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <a
                  href={thumbnail.url || '#'}
                  download
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <p className="text-white">No media available</p>
          </div>
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          aria-label="Close video"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  )
}