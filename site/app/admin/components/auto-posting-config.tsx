'use client'

import { useState, useEffect } from 'react'

interface AutoPostingConfig {
  enabled: boolean
  intervalMinutes: number
  batchSize: number
}

export default function AutoPostingConfig() {
  console.log('AutoPostingConfig component rendered')
  const [config, setConfig] = useState<AutoPostingConfig>({
    enabled: false,
    intervalMinutes: 30,
    batchSize: 1
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [forceRender, setForceRender] = useState(0)

  useEffect(() => {
    console.log('useEffect called, fetching config...')
    const loadConfig = async () => {
      console.log('loadConfig called')
      try {
        await fetchConfig()
      } catch (error) {
        console.error('Error in useEffect fetchConfig:', error)
      }
    }
    loadConfig()
  }, [])

  useEffect(() => {
    console.log('Config state changed:', config)
  }, [config])

  const fetchConfig = async () => {
    console.log('fetchConfig called')
    try {
      const response = await fetch(`/api/auto-posting?t=${Date.now()}`)
      const data = await response.json()
      console.log('Fetched config:', data)
      if (data.success) {
        console.log('Before setConfig:', config)
        setConfig(data.data)
        console.log('After setConfig call, data.data:', data.data)
        setForceRender(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to fetch auto-posting config:', error)
    }
  }

  const updateConfig = async () => {
    try {
      setLoading(true)
      setMessage('')
      
      const response = await fetch('/api/auto-posting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage(data.data.message)
        setTimeout(() => setMessage(''), 3000)
        // Don't re-fetch config to preserve the current state
      } else {
        setMessage(data.error || 'Failed to update configuration')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      setMessage('Failed to update configuration')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const intervalOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" key={forceRender}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Auto-Posting Configuration
      </h3>
      
      {/* Debug info */}
      <div className="mb-4 p-2 bg-gray-100 text-xs">
        Debug: enabled={config.enabled.toString()}, interval={config.intervalMinutes}, batch={config.batchSize}
      </div>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Auto-Posting
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Posting Interval
          </label>
          <select
            value={config.intervalMinutes}
            onChange={(e) => setConfig({ ...config, intervalMinutes: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {intervalOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Posts per Batch
          </label>
          <select
            value={config.batchSize}
            onChange={(e) => setConfig({ ...config, batchSize: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {[1, 2, 3, 4, 5].map(size => (
              <option key={size} value={size}>
                {size} post{size > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={updateConfig}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>How it works:</strong> When enabled, the system will automatically publish READY posts 
          every {config.intervalMinutes} minute{config.intervalMinutes > 1 ? 's' : ''}, 
          publishing {config.batchSize} post{config.batchSize > 1 ? 's' : ''} at a time.
        </p>
      </div>
    </div>
  )
}
