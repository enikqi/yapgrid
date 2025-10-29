'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { AppSettings } from '@/lib/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    subreddits: [],
    keywords: [],
    minUpvotes: 100,
    includeNsfw: false,
    maxDuration: 900,
    maxFilesize: 400,
    watermarkEnabled: false,
    autoIngest: false,
    autoPublish: false,
    requireApproval: false,
    titleTemplate: '{title}',
    descriptionTemplate: '{title} • r/{subreddit} | Source: https://reddit.com{permalink}',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSubreddit, setNewSubreddit] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const addSubreddit = () => {
    if (newSubreddit && !settings.subreddits.includes(newSubreddit)) {
      setSettings({
        ...settings,
        subreddits: [...settings.subreddits, newSubreddit],
      })
      setNewSubreddit('')
    }
  }

  const removeSubreddit = (subreddit: string) => {
    setSettings({
      ...settings,
      subreddits: settings.subreddits.filter(s => s !== subreddit),
    })
  }

  const addKeyword = () => {
    if (newKeyword && !settings.keywords.includes(newKeyword)) {
      setSettings({
        ...settings,
        keywords: [...settings.keywords, newKeyword],
      })
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setSettings({
      ...settings,
      keywords: settings.keywords.filter(k => k !== keyword),
    })
  }

  if (loading) {
    return <div className="p-6">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure your YapGrid automation
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid gap-6">
        {/* Subreddits */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Subreddits</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubreddit}
                onChange={(e) => setNewSubreddit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubreddit()}
                placeholder="Enter subreddit name (without r/)"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
              <button
                onClick={addSubreddit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {settings.subreddits.map((subreddit) => (
                <div
                  key={subreddit}
                  className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span>r/{subreddit}</span>
                  <button
                    onClick={() => removeSubreddit(subreddit)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Keyword Filters</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="Enter keyword to filter by"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
              <button
                onClick={addKeyword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.keywords.map((keyword) => (
                <div
                  key={keyword}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                  <span className="text-sm">{keyword}</span>
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Content Filters</h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Minimum Upvotes
              </label>
              <input
                type="number"
                value={settings.minUpvotes}
                onChange={(e) => setSettings({ ...settings, minUpvotes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Duration (seconds)
              </label>
              <input
                type="number"
                value={settings.maxDuration}
                onChange={(e) => setSettings({ ...settings, maxDuration: parseInt(e.target.value) || 900 })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Max File Size (MB)
              </label>
              <input
                type="number"
                value={settings.maxFilesize}
                onChange={(e) => setSettings({ ...settings, maxFilesize: parseInt(e.target.value) || 400 })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeNsfw"
                checked={settings.includeNsfw}
                onChange={(e) => setSettings({ ...settings, includeNsfw: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="includeNsfw" className="text-sm">
                Include NSFW content
              </label>
            </div>
          </div>
        </div>

        {/* Automation */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Automation</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoIngest"
                checked={settings.autoIngest}
                onChange={(e) => setSettings({ ...settings, autoIngest: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="autoIngest">
                Enable automatic Reddit ingest
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoPublish"
                checked={settings.autoPublish}
                onChange={(e) => setSettings({ ...settings, autoPublish: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="autoPublish">
                Enable automatic Pinterest publishing
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requireApproval"
                checked={settings.requireApproval}
                onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="requireApproval">
                Require manual approval before publishing
              </label>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Pin Templates</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Title Template
              </label>
              <input
                type="text"
                value={settings.titleTemplate}
                onChange={(e) => setSettings({ ...settings, titleTemplate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {'{title}'}, {'{subreddit}'}, {'{author}'}, {'{score}'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description Template
              </label>
              <textarea
                value={settings.descriptionTemplate}
                onChange={(e) => setSettings({ ...settings, descriptionTemplate: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {'{title}'}, {'{subreddit}'}, {'{author}'}, {'{score}'}, {'{permalink}'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
