'use client'

import { useState, useEffect } from 'react'
import { Plus, Play, TestTube, Trash2, Edit, Settings, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface RedditCampaign {
  id: string
  name: string
  subreddits: string[]
  keywords: string[]
  excludeKeywords: string[]
  minScore: number
  maxScore?: number
  sortBy: 'hot' | 'new' | 'top' | 'rising'
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
  includeNsfw: boolean
  postLimit: number
  enabled: boolean
  lastRun?: string
  nextRun?: string
}

interface SessionConfig {
  sessionCookie: string
  enabled: boolean
}

// Removed PostingConfig interface - posts go directly to homepage

export default function RedditCampaignsPage() {
  const [campaigns, setCampaigns] = useState<RedditCampaign[]>([])
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({ sessionCookie: '', enabled: false })
      // Removed posting config - posts will go directly to homepage
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
      // Removed posting modal
  const [editingCampaign, setEditingCampaign] = useState<RedditCampaign | null>(null)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subreddits: '',
    keywords: '',
    excludeKeywords: '',
    minScore: 10,
    postLimit: 10,
    sortBy: 'hot',
    timeRange: 'day',
    includeNsfw: false,
    enabled: true,
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [campaignsRes, sessionRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/reddit-session'),
      ])

      const campaignsData = await campaignsRes.json()
      const sessionData = await sessionRes.json()

      if (campaignsData.success) {
        setCampaigns(campaignsData.data)
      }
      if (sessionData.success) {
        setSessionConfig(sessionData.data.sessionConfig)
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

      const testSession = async () => {
        try {
          const response = await fetch('/api/reddit-session/test', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionCookie: sessionConfig.sessionCookie
            })
          })
          const data = await response.json()
          
          if (data.success && data.data.isSessionValid) {
            toast.success('Reddit session is valid!')
          } else {
            toast.error('Reddit session is invalid')
          }
        } catch (error) {
          toast.error('Failed to test session')
        }
      }

      const saveSessionConfig = async () => {
        try {
          const response = await fetch('/api/reddit-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionCookie: sessionConfig.sessionCookie,
              enabled: sessionConfig.enabled
            })
          })
          const data = await response.json()
          
          if (data.success) {
            toast.success('Session configuration saved!')
            setShowSessionModal(false)
            loadData() // Reload to update status
          } else {
            toast.error(data.error || 'Failed to save session configuration')
          }
        } catch (error) {
          toast.error('Failed to save session configuration')
        }
      }

      const deleteSessionConfig = async () => {
        if (!confirm('Are you sure you want to delete the session configuration?')) return

        try {
          const response = await fetch('/api/reddit-session', { method: 'DELETE' })
          const data = await response.json()
          
          if (data.success) {
            toast.success('Session configuration deleted!')
            setSessionConfig({ sessionCookie: '', enabled: false })
            setShowSessionModal(false)
            loadData() // Reload to update status
          } else {
            toast.error(data.error || 'Failed to delete session configuration')
          }
        } catch (error) {
          toast.error('Failed to delete session configuration')
        }
      }

      const testPosting = async () => {
        // Removed - posts go directly to homepage
      }

      const runCampaign = async (campaignId: string) => {
        try {
          const response = await fetch(`/api/campaigns/${campaignId}/run`, { method: 'POST' })
          const data = await response.json()
          
          if (data.success) {
            toast.success(`Campaign executed: ${data.data.postsSaved} posts saved`)
            loadData() // Reload to update last run time
          } else {
            toast.error(data.error || 'Failed to run campaign')
          }
        } catch (error) {
          toast.error('Failed to run campaign')
        }
      }

  const testCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/test`, { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Test completed: ${data.data.postsFound} posts found`)
      } else {
        toast.error(data.error || 'Failed to test campaign')
      }
    } catch (error) {
      toast.error('Failed to test campaign')
    }
  }

  const createCampaign = async () => {
    try {
      const campaignData = {
        name: newCampaign.name,
        subreddits: newCampaign.subreddits.split(',').map(s => s.trim()).filter(s => s),
        keywords: newCampaign.keywords.split(',').map(s => s.trim()).filter(s => s),
        excludeKeywords: newCampaign.excludeKeywords.split(',').map(s => s.trim()).filter(s => s),
        minScore: newCampaign.minScore,
        postLimit: newCampaign.postLimit,
        sortBy: newCampaign.sortBy,
        timeRange: newCampaign.timeRange,
        includeNsfw: newCampaign.includeNsfw,
        enabled: newCampaign.enabled,
      }

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Campaign created successfully!')
        loadData() // Reload campaigns list
        setShowCreateModal(false)
        // Reset form
        setNewCampaign({
          name: '',
          subreddits: '',
          keywords: '',
          excludeKeywords: '',
          minScore: 10,
          postLimit: 10,
          sortBy: 'hot',
          timeRange: 'day',
          includeNsfw: false,
          enabled: true,
        })
      } else {
        toast.error(data.error || 'Failed to create campaign')
      }
    } catch (error) {
      toast.error('Failed to create campaign')
    }
  }

  const updateCampaign = async () => {
    if (!editingCampaign) return

    try {
      const campaignData = {
        name: editingCampaign.name,
        subreddits: Array.isArray(editingCampaign.subreddits) 
          ? editingCampaign.subreddits 
          : JSON.parse(editingCampaign.subreddits as string),
        keywords: Array.isArray(editingCampaign.keywords) 
          ? editingCampaign.keywords 
          : JSON.parse(editingCampaign.keywords as string),
        excludeKeywords: Array.isArray(editingCampaign.excludeKeywords) 
          ? editingCampaign.excludeKeywords 
          : JSON.parse(editingCampaign.excludeKeywords as string),
        minScore: editingCampaign.minScore,
        maxScore: editingCampaign.maxScore,
        sortBy: editingCampaign.sortBy,
        timeRange: editingCampaign.timeRange,
        includeNsfw: editingCampaign.includeNsfw,
        postLimit: editingCampaign.postLimit,
        enabled: editingCampaign.enabled,
      }

      const response = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Campaign updated successfully!')
        loadData() // Reload campaigns list
        setEditingCampaign(null)
      } else {
        toast.error(data.error || 'Failed to update campaign')
      }
    } catch (error) {
      toast.error('Failed to update campaign')
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Campaign deleted successfully!')
        loadData() // Reload campaigns list
      } else {
        toast.error(data.error || 'Failed to delete campaign')
      }
    } catch (error) {
      toast.error('Failed to delete campaign')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Reddit Campaigns
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage Reddit content campaigns and automatic posting
          </p>
        </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSessionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Session Config
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reddit Session</p>
              <p className="text-2xl font-bold mt-1">
                {sessionConfig.enabled ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </p>
            </div>
            <button
              onClick={testSession}
              className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg"
            >
              <TestTube className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</p>
              <p className="text-2xl font-bold mt-1">{campaigns?.length || 0}</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800">
        <div className="p-6 border-b dark:border-gray-800">
          <h3 className="text-lg font-semibold">Campaigns</h3>
        </div>
        <div className="p-6">
          {campaigns?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No campaigns created yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns?.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {campaign.name}
                        </h4>
                        {campaign.enabled ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Subreddits: {campaign.subreddits.join(', ')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Min Score: {campaign.minScore} | Sort: {campaign.sortBy} | Limit: {campaign.postLimit}
                      </p>
                      {campaign.lastRun && (
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Last run: {new Date(campaign.lastRun).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => testCampaign(campaign.id)}
                        className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        title="Test Campaign"
                      >
                        <TestTube className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => runCampaign(campaign.id)}
                        className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                        title="Run Campaign"
                      >
                        <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </button>
                      <button
                        onClick={() => setEditingCampaign(campaign)}
                        className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors"
                        title="Edit Campaign"
                      >
                        <Edit className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaign.id)}
                        className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session Config Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reddit Session Configuration</h3>
              <button
                onClick={() => setShowSessionModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Session Cookie</label>
                <textarea
                  value={sessionConfig.sessionCookie}
                  onChange={(e) => setSessionConfig({...sessionConfig, sessionCookie: e.target.value})}
                  placeholder="reddit_session=..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={sessionConfig.enabled}
                  onChange={(e) => setSessionConfig({...sessionConfig, enabled: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm">Enable Session Cookie</label>
              </div>
              
                  <div className="flex gap-2">
                    <button
                      onClick={testSession}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Test Session
                    </button>
                    <button
                      onClick={saveSessionConfig}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={deleteSessionConfig}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowSessionModal(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
            </div>
          </div>
        </div>
      )}

      {/* Posting Config Modal - Removed */}

          {/* Edit Campaign Modal */}
          {editingCampaign && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Edit Campaign</h3>
                  <button
                    onClick={() => setEditingCampaign(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Name</label>
                    <input
                      type="text"
                      value={editingCampaign.name}
                      onChange={(e) => setEditingCampaign({...editingCampaign, name: e.target.value})}
                      placeholder="My Reddit Campaign"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Subreddits (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingCampaign.subreddits) ? editingCampaign.subreddits.join(', ') : editingCampaign.subreddits}
                      onChange={(e) => setEditingCampaign({...editingCampaign, subreddits: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      placeholder="funny, videos, memes"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Keywords (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingCampaign.keywords) ? editingCampaign.keywords.join(', ') : editingCampaign.keywords}
                      onChange={(e) => setEditingCampaign({...editingCampaign, keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      placeholder="funny, viral, trending"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Exclude Keywords (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingCampaign.excludeKeywords) ? editingCampaign.excludeKeywords.join(', ') : editingCampaign.excludeKeywords}
                      onChange={(e) => setEditingCampaign({...editingCampaign, excludeKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      placeholder="nsfw, spoiler, repost"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Score</label>
                      <input
                        type="number"
                        value={editingCampaign.minScore}
                        onChange={(e) => setEditingCampaign({...editingCampaign, minScore: parseInt(e.target.value) || 0})}
                        placeholder="10"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Post Limit</label>
                      <input
                        type="number"
                        value={editingCampaign.postLimit}
                        onChange={(e) => setEditingCampaign({...editingCampaign, postLimit: parseInt(e.target.value) || 10})}
                        placeholder="25"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Sort By</label>
                      <select 
                        value={editingCampaign.sortBy}
                        onChange={(e) => setEditingCampaign({...editingCampaign, sortBy: e.target.value as any})}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="hot">Hot</option>
                        <option value="new">New</option>
                        <option value="top">Top</option>
                        <option value="rising">Rising</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Time Range</label>
                      <select 
                        value={editingCampaign.timeRange}
                        onChange={(e) => setEditingCampaign({...editingCampaign, timeRange: e.target.value as any})}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                        <option value="all">All Time</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingCampaign.includeNsfw}
                      onChange={(e) => setEditingCampaign({...editingCampaign, includeNsfw: e.target.checked})}
                      className="mr-2"
                    />
                    <label className="text-sm">Include NSFW Content</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingCampaign.enabled}
                      onChange={(e) => setEditingCampaign({...editingCampaign, enabled: e.target.checked})}
                      className="mr-2"
                    />
                    <label className="text-sm">Enable Campaign</label>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={updateCampaign}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Update Campaign
                    </button>
                    <button
                      onClick={() => setEditingCampaign(null)}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Campaign Modal */}
          {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Campaign</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  placeholder="My Reddit Campaign"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subreddits (comma separated)</label>
                <input
                  type="text"
                  value={newCampaign.subreddits}
                  onChange={(e) => setNewCampaign({...newCampaign, subreddits: e.target.value})}
                  placeholder="funny, videos, memes"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Keywords (comma separated)</label>
                <input
                  type="text"
                  value={newCampaign.keywords}
                  onChange={(e) => setNewCampaign({...newCampaign, keywords: e.target.value})}
                  placeholder="funny, viral, trending"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Exclude Keywords (comma separated)</label>
                <input
                  type="text"
                  value={newCampaign.excludeKeywords}
                  onChange={(e) => setNewCampaign({...newCampaign, excludeKeywords: e.target.value})}
                  placeholder="nsfw, spoiler, repost"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Score</label>
                  <input
                    type="number"
                    value={newCampaign.minScore}
                    onChange={(e) => setNewCampaign({...newCampaign, minScore: parseInt(e.target.value) || 0})}
                    placeholder="10"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Post Limit</label>
                  <input
                    type="number"
                    value={newCampaign.postLimit}
                    onChange={(e) => setNewCampaign({...newCampaign, postLimit: parseInt(e.target.value) || 10})}
                    placeholder="25"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select 
                    value={newCampaign.sortBy}
                    onChange={(e) => setNewCampaign({...newCampaign, sortBy: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="hot">Hot</option>
                    <option value="new">New</option>
                    <option value="top">Top</option>
                    <option value="rising">Rising</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time Range</label>
                  <select 
                    value={newCampaign.timeRange}
                    onChange={(e) => setNewCampaign({...newCampaign, timeRange: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newCampaign.includeNsfw}
                  onChange={(e) => setNewCampaign({...newCampaign, includeNsfw: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm">Include NSFW Content</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newCampaign.enabled}
                  onChange={(e) => setNewCampaign({...newCampaign, enabled: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm">Enable Campaign</label>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={createCampaign}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Campaign
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
