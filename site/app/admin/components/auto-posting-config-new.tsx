'use client'

import { useState, useEffect } from 'react'

export default function AutoPostingConfigNew() {
  const [enabled, setEnabled] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(1)
  const [batchSize, setBatchSize] = useState(3)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Load config on mount
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/auto-posting?t=' + Date.now())
      const data = await res.json()
      console.log('Loaded config:', data)
      if (data.success) {
        setEnabled(data.data.enabled === true || data.data.enabled === 'true')
        setIntervalMinutes(Number(data.data.intervalMinutes))
        setBatchSize(Number(data.data.batchSize))
        console.log('Set state:', {
          enabled: data.data.enabled,
          intervalMinutes: data.data.intervalMinutes,
          batchSize: data.data.batchSize
        })
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  const saveConfig = async () => {
    try {
      setLoading(true)
      setMessage('')

      const res = await fetch('/api/auto-posting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          intervalMinutes,
          batchSize
        })
      })

      const data = await res.json()
      if (data.success) {
        setMessage('✅ Configuration saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('❌ Failed to save configuration')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      setMessage('❌ Failed to save configuration')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Auto-Posting Configuration
      </h3>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('✅')
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        {/* Enable checkbox */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Auto-Posting {enabled ? '✅' : '❌'}
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Interval */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Posting Interval
          </label>
          <select
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 minute</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>

        {/* Batch size */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Posts per Batch
          </label>
          <select
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 post</option>
            <option value={2}>2 posts</option>
            <option value={3}>3 posts</option>
            <option value={4}>4 posts</option>
            <option value={5}>5 posts</option>
          </select>
        </div>

        <button
          onClick={saveConfig}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <strong>How it works:</strong> When enabled, the system will automatically publish READY posts 
        every {intervalMinutes} minute{intervalMinutes !== 1 ? 's' : ''}, publishing {batchSize} post{batchSize !== 1 ? 's' : ''} at a time.
      </p>
    </div>
  )
}

