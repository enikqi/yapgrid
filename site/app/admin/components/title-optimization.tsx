'use client'

import { useState, useEffect } from 'react'
import { Edit3, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface OptimizationResult {
  postId: string
  originalTitle: string
  optimizedTitle: string
  success: boolean
  reason?: string
}

export default function TitleOptimization() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [results, setResults] = useState<OptimizationResult[]>([])
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [batchSize, setBatchSize] = useState(10)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/optimize-titles?limit=50')
      const data = await response.json()
      
      if (data.success) {
        setPosts(data.data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const optimizeTitles = async () => {
    if (selectedPosts.length === 0) {
      alert('Please select posts to optimize')
      return
    }

    setOptimizing(true)
    setResults([])

    try {
      const response = await fetch('/api/optimize-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postIds: selectedPosts,
          batchSize
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setResults(data.data.results)
        setSelectedPosts([])
        fetchPosts() // Refresh posts
      } else {
        alert('Error optimizing titles: ' + data.error)
      }
    } catch (error) {
      console.error('Error optimizing titles:', error)
      alert('Error optimizing titles')
    } finally {
      setOptimizing(false)
    }
  }

  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  const selectAll = () => {
    setSelectedPosts(posts.map(post => post.id))
  }

  const clearSelection = () => {
    setSelectedPosts([])
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Edit3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Title Optimization</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Batch Size:</label>
            <select 
              value={batchSize} 
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <button
            onClick={optimizeTitles}
            disabled={optimizing || selectedPosts.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {optimizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>Optimize Selected ({selectedPosts.length})</span>
          </button>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Select All
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={clearSelection}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Selection
          </button>
        </div>
        <div className="text-sm text-gray-600">
          {selectedPosts.length} of {posts.length} selected
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Optimization Results</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex-1">
                  <div className="text-sm text-gray-600 line-through">
                    {result.originalTitle}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {result.optimizedTitle}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-xs text-gray-500">
                    {result.success ? 'Optimized' : result.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-600 mt-2">Loading posts...</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedPosts.includes(post.id)}
                onChange={() => togglePostSelection(post.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {post.title}
                </div>
                <div className="text-xs text-gray-500">
                  r/{post.subreddit} • {post.contentType} • {new Date(post.publishedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                ID: {post.id.slice(0, 8)}...
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
