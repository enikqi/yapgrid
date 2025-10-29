'use client'

import { useState, useEffect } from 'react'

interface AutoProcessingConfig {
  enabled: boolean
  delaySeconds: number
  batchSize: number
}

export default function AutoProcessingConfig() {
  const [config, setConfig] = useState<AutoProcessingConfig>({
    enabled: false,
    delaySeconds: 10,
    batchSize: 1
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  // Track if we've successfully saved to prevent refetch
  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => {
    // Only fetch config on initial load
    fetchConfig()
  }, []) // Empty dependency array ensures it runs only once on mount

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/auto-processing')
      const data = await response.json()
      if (data.success) {
        // Convert string values to proper types
        setConfig({
          enabled: data.data.enabled === true || data.data.enabled === 'true',
          delaySeconds: parseInt(data.data.delaySeconds),
          batchSize: parseInt(data.data.batchSize)
        })
      }
    } catch (error) {
      console.error('Failed to fetch auto-processing config:', error)
    }
  }

  const updateConfig = async () => {
    try {
      setLoading(true)
      setMessage('')
      
      const response = await fetch('/api/auto-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage(data.data.message)
        setHasSaved(true) // Mark as saved to prevent refetch
        setTimeout(() => setMessage(''), 3000)
        // Don't refetch config after successful save to preserve checkbox state
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

  const delayOptions = [
    { value: 5, label: '5 seconds' },
    { value: 10, label: '10 seconds' },
    { value: 15, label: '15 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 300, label: '5 minutes' }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Auto-Processing Configuration
      </h3>
      
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
            Enable Auto-Processing
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

        {/* Delay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Delay Between Posts
          </label>
          <select
            value={config.delaySeconds}
            onChange={(e) => setConfig({ ...config, delaySeconds: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {delayOptions.map(option => (
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
          <strong>How it works:</strong> When enabled, the system will automatically process NEW posts 
          every 30 seconds, processing {config.batchSize} post{config.batchSize > 1 ? 's' : ''} at a time 
          with a {config.delaySeconds} second delay between each post to ensure proper processing.
        </p>
      </div>
    </div>
  )
}
