'use client'

import { useState, useEffect } from 'react'
import { Download, Play, Image, FileVideo, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface MediaAsset {
  id: string
  type: string
  path: string
  filename: string
  size: number
  sizeMB: string
  width?: number
  height?: number
  duration?: number
  createdAt: string
  exists: boolean
  error?: string
}

interface MediaInfoProps {
  postId: string
}

export default function MediaInfo({ postId }: MediaInfoProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMediaInfo()
  }, [postId])

  const fetchMediaInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/media/info?postId=${postId}`)
      const data = await response.json()
      
      if (data.success) {
        setAssets(data.data.assets)
      } else {
        toast.error(data.error || 'Failed to fetch media info')
      }
    } catch (error) {
      toast.error('Failed to fetch media info')
    } finally {
      setLoading(false)
    }
  }

  const getMediaIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <FileVideo className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

          const getMediaUrl = (path: string) => {
            // Convert filename to API URL
            return `/api/media/${path}`
          }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No media files found for this post
      </div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Downloaded Media</h3>
      <div className="space-y-3">
        {assets.map((asset) => (
          <div key={asset.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getMediaIcon(asset.type)}
                <div>
                  <div className="font-medium text-sm">{asset.filename}</div>
                  <div className="text-xs text-gray-500">
                    {asset.type.toUpperCase()} • {asset.sizeMB}MB
                    {asset.width && asset.height && ` • ${asset.width}x${asset.height}`}
                    {asset.duration && ` • ${formatDuration(asset.duration)}`}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {asset.exists ? (
                  <>
                    {asset.type.toLowerCase() === 'video' && (
                      <button
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                        onClick={() => window.open(getMediaUrl(asset.path), '_blank')}
                      >
                        <Play className="h-3 w-3" />
                        Play
                      </button>
                    )}
                    {asset.type.toLowerCase() === 'image' && (
                      <button
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                        onClick={() => window.open(getMediaUrl(asset.path), '_blank')}
                      >
                        <Image className="h-3 w-3" />
                        View
                      </button>
                    )}
                    <button
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = getMediaUrl(asset.path)
                        link.download = asset.filename
                        link.click()
                      }}
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                  </>
                ) : (
                  <div className="text-red-500 text-xs">
                    File not found
                  </div>
                )}
              </div>
            </div>
            
            {!asset.exists && asset.error && (
              <div className="mt-2 text-xs text-red-500">
                Error: {asset.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
