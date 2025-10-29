'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Heart, Share2, ExternalLink, AlertCircle } from 'lucide-react'
import { cn, formatDuration, formatNumber } from '@/lib/utils'
import type { Post, Asset } from '@/lib/types'

interface VideoCardProps {
  post: Post & {
    assets: Asset[]
  }
  onPlay?: () => void
}

export function VideoCard({ post, onPlay }: VideoCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const thumbnail = post.assets.find(a => a.type === 'THUMBNAIL')
  const video = post.assets.find(a => a.type === 'VIDEO')

  // Use thumbnail asset, then Reddit preview, then placeholder
  const thumbnailUrl = thumbnail?.url || 
    (post.preview && !imageError ? post.preview : null) ||
    '/placeholder-video.jpg'
  
  const aspectRatio = thumbnail?.width && thumbnail?.height 
    ? thumbnail.width / thumbnail.height 
    : 16 / 9

  return (
    <div 
      className="group relative bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
    >
      {/* Thumbnail */}
      <div className="relative" style={{ aspectRatio }}>
        {!imageError ? (
          <Image
            src={thumbnailUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageError(true)}
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <div className="text-center">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Video</p>
            </div>
          </div>
        )}

        {/* Overlay on hover */}
        <div className={cn(
          "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <Play className="w-12 h-12 text-white" fill="white" />
        </div>

        {/* Duration badge */}
        {video?.durationSec && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.durationSec)}
          </div>
        )}

        {/* NSFW badge */}
        {post.nsfw && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
            NSFW
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
          {post.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>r/{post.subreddit}</span>
            <span>•</span>
            <span>{formatNumber(post.score)} ↑</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // Handle save
              }}
              aria-label="Save"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // Handle share
              }}
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <Link
              href={`https://reddit.com${post.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label="View on Reddit"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
