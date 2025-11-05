'use client'

import { useState, useEffect } from 'react'
import { Clock, Video, Image, Link, FileText, Layers, ExternalLink } from 'lucide-react'

interface ReadyPost {
  id: string
  title: string
  url: string
  subreddit: string
  score: number
  scheduledPublishAt: string | null
  assets: Array<{ type: string }>
  preview: string | null
}

export default function ReadyPostsList() {
  const [posts, setPosts] = useState<ReadyPost[]>([])
  const [loading, setLoading] = useState(false)
  const [showList, setShowList] = useState(false)

  const fetchReadyPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/ready-posts')
      const data = await response.json()
      if (data.success) {
        setPosts(data.data.posts)
      }
    } catch (error) {
      console.error('Failed to fetch ready posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showList && posts.length === 0) {
      fetchReadyPosts()
    }
  }, [showList])
  
  // Also fetch on mount to show count
  useEffect(() => {
    fetchReadyPosts()
  }, [])

  const getPostType = (post: ReadyPost): { type: string; icon: any; color: string } => {
    const url = post.url || ''
    const assets = post.assets || []
    
    if (url.includes('v.redd.it') || assets.some(a => a.type === 'VIDEO')) {
      return { type: 'Video', icon: Video, color: 'text-red-600 dark:text-red-400' }
    }
    if (url.includes('/gallery/')) {
      return { type: 'Gallery', icon: Layers, color: 'text-purple-600 dark:text-purple-400' }
    }
    if (url.includes('i.redd.it') || assets.some(a => a.type === 'THUMBNAIL')) {
      if (url.includes('.gif') || url.includes('.gifv') || url.includes('gfycat')) {
        return { type: 'GIF', icon: Image, color: 'text-pink-600 dark:text-pink-400' }
      }
      return { type: 'Image', icon: Image, color: 'text-blue-600 dark:text-blue-400' }
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { type: 'YouTube', icon: ExternalLink, color: 'text-red-600 dark:text-red-400' }
    }
    if (url.includes('imgur.com') || url.includes('i.imgur.com')) {
      return { type: 'Imgur Image', icon: Image, color: 'text-green-600 dark:text-green-400' }
    }
    if (url.includes('/comments/') && !url.includes('redd.it')) {
      return { type: 'Text Post', icon: FileText, color: 'text-gray-600 dark:text-gray-400' }
    }
    if (!url.includes('reddit.com') && !url.includes('redd.it')) {
      return { type: 'External Link', icon: Link, color: 'text-orange-600 dark:text-orange-400' }
    }
    return { type: 'Text/Link', icon: FileText, color: 'text-gray-600 dark:text-gray-400' }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="mt-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Ready to Publish Posts
        </h3>
        <button
          onClick={() => {
            setShowList(!showList)
            if (!showList) {
              fetchReadyPosts()
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Clock className="w-4 h-4" />
          {showList ? 'Hide List' : 'Show List'} ({posts.length > 0 ? posts.length : '...'})
        </button>
      </div>

      {showList && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={fetchReadyPosts}
              disabled={loading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading && posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No posts ready to publish
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Subreddit</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Score</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Scheduled</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Assets</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => {
                    const postType = getPostType(post)
                    const Icon = postType.icon
                    return (
                      <tr key={post.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${postType.color}`} />
                            <span className={`text-sm font-medium ${postType.color}`}>
                              {postType.type}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-md truncate text-sm text-gray-900 dark:text-gray-100">
                            {post.title}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          r/{post.subreddit}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {post.score}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(post.scheduledPublishAt)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {post.assets?.length || 0} asset{post.assets?.length !== 1 ? 's' : ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

