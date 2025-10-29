'use client'

import { useState, useEffect } from 'react'
import { createLogger } from '@/lib/logger'
import { 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Settings, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  BarChart3,
  Eye,
  Heart,
  Share2,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

const logger = createLogger('admin/pinterest')

interface Campaign {
  id: string
  name: string
  subreddits: string[]
  keywords: string[]
}

interface PinterestCampaign {
  id: string
  name: string
  campaignId: string
  sessionId: string
  boardName: string
  scheduleInterval: number
  enabled: boolean
  lastRun: string | null
  nextRun: string | null
  createdAt: string
  updatedAt: string
  campaign: Campaign
  pinterestPosts: PinterestPost[]
}

interface PinterestPost {
  id: string
  title: string
  description: string | null
  imageUrl: string
  link: string | null
  boardName: string
  status: 'PENDING' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
}

interface PinterestBoard {
  id: string
  name: string
  description: string
  pinCount: number
  followerCount: number
}

export default function AdminPinterestPage() {
  const [pinterestCampaigns, setPinterestCampaigns] = useState<PinterestCampaign[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [boards, setBoards] = useState<PinterestBoard[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBoardsModal, setShowBoardsModal] = useState(false)
  
  // Form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    campaignId: '',
    sessionId: 'TWc9PSZqeUxaNzVPU2VrSStiRUIxaDJLNHNKYm54bnFzOG01Um9yeXR6VlJXYjN6cS9WRmdKMGJDMllGamgrY3pCMW1QY0FWenBJbTZTRytzSjVGRlVMUlhoWGRlRFdPQ3h0VlgxNU9qVDNERm42MnlKZFhxU0RkM1B6U1JPLzh0bXl3L0JTWndZdmJ4MUZ6N3lJL1IvY2gyZmJISTZabFFKcEpLRlFnckF4Zyt6L3VMVThhMGpvZW1pWWpGNEF0RFR1TWZrdmYvVmdzdUh2ckd3ekdHZHR1TXA5UUJBYlBtKzZ6aWk0cmlmbFhPUFNlNzBQVzRPYnlKeHMwazNuTXJDOWxFWWFWcEJwU3gxT0tiQmJML3hOdVBMa0d3eGlyUGRMRzN6ckVzQ044WS9kNGhuNG9IU0FEQW5oNEs3cFlYUGNybTNqN1Z6SXBIZ0lKRUNMMlB0aUM1UVkwN1NROHlsYnBOK3pqR2liOVZRQ1YzR3hHQjVzQm9uU0FJaVI0aS9qTms0NXpnbnhJVzhNczZ3UVRUeDFuc3ZRPT0mUVRhb0VuN0RsV2RYRnhvNjJMeHJPclV1bXBRPQ==',
    boardName: '',
    scheduleInterval: 60
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${window.location.origin}/api/admin/pinterest-campaigns`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Pinterest campaigns data')
      }

      const data = await response.json()

      if (data.success) {
        setPinterestCampaigns(data.data.pinterestCampaigns)
        setCampaigns(data.data.campaigns)
      } else {
        toast.error(data.error || 'Failed to load Pinterest campaigns data')
      }
    } catch (error) {
      console.error('Failed to fetch Pinterest campaigns data:', error)
      toast.error('Failed to load Pinterest campaigns data')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, data: any = {}) => {
    try {
      setActionLoading(action)
      
      const response = await fetch(`${window.location.origin}/api/admin/pinterest-campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.data.message)
        await fetchData()
      } else {
        toast.error(result.error || `Failed to ${action}`)
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
      toast.error(`Failed to ${action}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.campaignId || !newCampaign.sessionId || !newCampaign.boardName) {
      toast.error('Please fill in all required fields')
      return
    }

    await handleAction('create_campaign', newCampaign)
    setShowCreateModal(false)
    setNewCampaign({
      name: '',
      campaignId: '',
      sessionId: 'TWc9PSZqeUxaNzVPU2VrSStiRUIxaDJLNHNKYm54bnFzOG01Um9yeXR6VlJXYjN6cS9WRmdKMGJDMllGamgrY3pCMW1QY0FWenBJbTZTRytzSjVGRlVMUlhoWGRlRFdPQ3h0VlgxNU9qVDNERm42MnlKZFhxU0RkM1B6U1JPLzh0bXl3L0JTWndZdmJ4MUZ6N3lJL1IvY2gyZmJISTZabFFKcEpLRlFnckF4Zyt6L3VMVThhMGpvZW1pWWpGNEF0RFR1TWZrdmYvVmdzdUh2ckd3ekdHZHR1TXA5UUJBYlBtKzZ6aWk0cmlmbFhPUFNlNzBQVzRPYnlKeHMwazNuTXJDOWxFWWFWcEJwU3gxT0tiQmJML3hOdVBMa0d3eGlyUGRMRzN6ckVzQ044WS9kNGhuNG9IU0FEQW5oNEs3cFlYUGNybTNqN1Z6SXBIZ0lKRUNMMlB0aUM1UVkwN1NROHlsYnBOK3pqR2liOVZRQ1YzR3hHQjVzQm9uU0FJaVI0aS9qTms0NXpnbnhJVzhNczZ3UVRUeDFuc3ZRPT0mUVRhb0VuN0RsV2RYRnhvNjJMeHJPclV1bXBRPQ==',
      boardName: '',
      scheduleInterval: 60
    })
  }

  const handleFetchBoards = async () => {
    try {
      setActionLoading('fetch_boards')
      
      const response = await fetch(`${window.location.origin}/api/admin/pinterest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'fetch_boards', sessionId: newCampaign.sessionId })
      })

      const result = await response.json()

      if (result.success) {
        setBoards(result.data.boards)
        setShowBoardsModal(true)
        
        // Show instructions if available
        if (result.data.instructions) {
          const instructions = result.data.instructions.join('\n')
          alert(`Pinterest Boards Instructions:\n\n${instructions}`)
        }
        
        toast.success('Pinterest boards fetched successfully!')
      } else {
        toast.error(result.error || 'Failed to fetch boards')
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error)
      toast.error('Failed to fetch boards')
    } finally {
      setActionLoading(null)
    }
  }

  const handleOpenPinterestLogin = async () => {
    try {
      setActionLoading('open_login')
      
      const response = await fetch(`${window.location.origin}/api/admin/pinterest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'open_pinterest_login' })
      })

      const result = await response.json()

      if (result.success) {
        // Show instructions in a modal or alert
        const instructions = result.data.instructions.join('\n')
        alert(`Pinterest Login Instructions:\n\n${instructions}\n\nCommand: ${result.data.command}`)
        toast.success('Instructions shown! Please follow them to log in to Pinterest.')
      } else {
        toast.error(result.error || 'Failed to get Pinterest login instructions')
      }
    } catch (error) {
      console.error('Failed to open Pinterest login:', error)
      toast.error('Failed to open Pinterest login')
    } finally {
      setActionLoading(null)
    }
  }

  const handleTestSession = async () => {
    await handleAction('test_session', { sessionId: newCampaign.sessionId })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'SCHEDULED':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'SCHEDULED':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatInterval = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)}h`
    } else {
      return `${Math.floor(minutes / 1440)}d`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-2 text-gray-600">Loading Pinterest campaigns...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">Pinterest Campaigns</h1>
              <p className="text-gray-600 mt-2">Manage Pinterest posting campaigns from your Reddit campaigns</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {pinterestCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAction('toggle_campaign', { 
                      toggleId: campaign.id, 
                      enabled: !campaign.enabled 
                    })}
                    disabled={actionLoading === `toggle_${campaign.id}`}
                    className={`p-1 rounded ${
                      campaign.enabled 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {campaign.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleAction('delete_campaign', { campaignId: campaign.id })}
                    disabled={actionLoading === `delete_${campaign.id}`}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Source Campaign:</span>
                  <span className="text-sm font-medium text-gray-900">{campaign.campaign.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Board:</span>
                  <span className="text-sm font-medium text-gray-900">{campaign.boardName}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Interval:</span>
                  <span className="text-sm font-medium text-gray-900">{formatInterval(campaign.scheduleInterval)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {campaign.nextRun && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Next Run:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(campaign.nextRun).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Posts:</span>
                    <span className="font-medium text-gray-900">{campaign.pinterestPosts.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Posts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Pinterest Posts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Board
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pinterestCampaigns.flatMap(campaign => 
                  campaign.pinterestPosts.map(post => (
                    <tr key={post.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-16 h-16 object-cover rounded-lg mr-4"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-image.jpg'
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {post.title}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {post.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {campaign.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {post.boardName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(post.status)}
                          <span className={`ml-2 text-sm font-medium capitalize ${getStatusColor(post.status).split(' ')[0]}`}>
                            {post.status.toLowerCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.link && (
                          <a
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Pinterest Campaign</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter campaign name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Campaign *
                  </label>
                  <select
                    value={newCampaign.campaignId}
                    onChange={(e) => setNewCampaign({ ...newCampaign, campaignId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select a campaign</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name} ({campaign.subreddits.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pinterest Session ID *
                  </label>
                  <div className="flex space-x-2">
                    <textarea
                      value={newCampaign.sessionId}
                      onChange={(e) => setNewCampaign({ ...newCampaign, sessionId: e.target.value })}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-sm"
                      placeholder="Enter Pinterest session ID"
                    />
                    <button
                      onClick={handleTestSession}
                      disabled={actionLoading === 'test_session'}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Test
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pinterest Board *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCampaign.boardName}
                      onChange={(e) => setNewCampaign({ ...newCampaign, boardName: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter board name"
                    />
                    <button
                      onClick={handleFetchBoards}
                      disabled={actionLoading === 'fetch_boards'}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Fetch Boards
                    </button>
                    <button
                      onClick={handleOpenPinterestLogin}
                      disabled={actionLoading === 'open_login'}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Open Pinterest Login
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posting Interval (minutes)
                  </label>
                  <input
                    type="number"
                    value={newCampaign.scheduleInterval}
                    onChange={(e) => setNewCampaign({ ...newCampaign, scheduleInterval: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    min="1"
                    max="1440"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    How often to post to Pinterest (1-1440 minutes)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCampaign}
                  disabled={actionLoading === 'create_campaign'}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === 'create_campaign' ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Boards Modal */}
        {showBoardsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Pinterest Boards</h2>
              
              <div className="space-y-3">
                {boards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No boards found. Please try again.
                  </div>
                ) : (
                  boards.map((board) => (
                    <div
                      key={board.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setNewCampaign({ ...newCampaign, boardName: board.name })
                        setShowBoardsModal(false)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{board.name}</h3>
                          <p className="text-sm text-gray-600">{board.description}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>{board.pinCount} pins</div>
                          <div>{board.followerCount} followers</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowBoardsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}