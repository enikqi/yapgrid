'use client'

import { useState, useEffect } from 'react'
import { createLogger } from '@/lib/logger'
import { RefreshCw, Settings, Users, TrendingUp, Activity, AlertCircle, CheckCircle, Clock, Play, Pause, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

const logger = createLogger('admin/reddit')

interface RedditStats {
  totalSubreddits: number
  activeSubreddits: number
  totalPosts: number
  publishedPosts: number
  newPosts: number
  readyPosts: number
  failedPosts: number
  lastFetchTime: string | null
  fetchStatus: 'active' | 'idle' | 'error'
  sessionStatus: 'active' | 'expired' | 'error'
}

interface SubredditInfo {
  name: string
  postsCount: number
  lastFetchTime: string | null
  status: 'active' | 'inactive' | 'error'
}

export default function AdminRedditPage() {
  const [stats, setStats] = useState<RedditStats | null>(null)
  const [subreddits, setSubreddits] = useState<SubredditInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchRedditData()
  }, [])

  const fetchRedditData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${window.location.origin}/api/admin/reddit`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Reddit data')
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.data.stats)
        setSubreddits(data.data.subreddits)
      } else {
        toast.error(data.error || 'Failed to load Reddit data')
      }
    } catch (error) {
      console.error('Failed to fetch Reddit data:', error)
      toast.error('Failed to load Reddit data')
    } finally {
      setLoading(false)
    }
  }

  const handleRedditAction = async (action: string) => {
    try {
      setActionLoading(action)
      
      const response = await fetch(`${window.location.origin}/api/admin/reddit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })

      const data = await response.json()

      if (data.success) {
        await fetchRedditData()
        toast.success(data.data.message)
      } else {
        toast.error(data.error || `Failed to ${action}`)
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
      toast.error(`Failed to ${action}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'idle':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'idle':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading Reddit data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reddit Management</h1>
              <p className="text-gray-600 mt-2">Monitor and manage Reddit data fetching and processing</p>
            </div>
            <button
              onClick={fetchRedditData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subreddits</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSubreddits}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.publishedPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fetch Status</p>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(stats.fetchStatus)}
                    <span className={`ml-2 text-sm font-medium capitalize ${getStatusColor(stats.fetchStatus).split(' ')[0]}`}>
                      {stats.fetchStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reddit Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleRedditAction('clear_cache')}
              disabled={actionLoading === 'clear_cache'}
              className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {actionLoading === 'clear_cache' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Clear Cache
            </button>

            <button
              onClick={() => handleRedditAction('test_session')}
              disabled={actionLoading === 'test_session'}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading === 'test_session' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Test Session
            </button>

            <button
              onClick={() => handleRedditAction('refresh_subreddits')}
              disabled={actionLoading === 'refresh_subreddits'}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading === 'refresh_subreddits' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Refresh Subreddits
            </button>
          </div>
        </div>

        {/* Subreddits Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Subreddits</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subreddit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posts Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Fetch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subreddits.map((subreddit) => (
                  <tr key={subreddit.name}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        r/{subreddit.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subreddit.postsCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subreddit.lastFetchTime 
                          ? new Date(subreddit.lastFetchTime).toLocaleString()
                          : 'Never'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(subreddit.status)}
                        <span className={`ml-2 text-sm font-medium capitalize ${getStatusColor(subreddit.status).split(' ')[0]}`}>
                          {subreddit.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
