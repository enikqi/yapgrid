'use client'

import { useState, useEffect } from 'react'
import { Smartphone, RefreshCw, Trash2, Download } from 'lucide-react'

interface LogEntry {
  timestamp: string
  ip: string
  userAgent: string
  level: string
  message: string
  data?: Record<string, unknown>
  component?: string
}

export default function MobileLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all')

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug/mobile-logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all mobile logs?')) return
    
    try {
      const response = await fetch('/api/debug/mobile-logs', {
        method: 'DELETE'
      })
      if (response.ok) {
        setLogs([])
      }
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  const downloadLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mobile-logs-${new Date().toISOString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchLogs()
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [])

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.level === filter
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warn': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      case 'debug': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mobile Debug Logs</h1>
              <p className="text-sm text-gray-600">Real-time mobile device debugging</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={downloadLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            
            <button
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          {(['all', 'error', 'warn', 'info'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === level
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
              {level !== 'all' && (
                <span className="ml-2 text-xs">
                  ({logs.filter(l => l.level === level).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Logs display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading && logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Smartphone className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No logs found</p>
            <p className="text-sm mt-1">Logs will appear here when mobile users interact with videos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    {log.component && (
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-medium">
                        {log.component}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <p className="font-medium text-gray-900 mb-2">{log.message}</p>
                
                {log.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                      View details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  <div>IP: {log.ip}</div>
                  <div className="truncate">User Agent: {log.userAgent}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
          <div className="text-sm text-gray-600">Total Logs</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {logs.filter(l => l.level === 'error').length}
          </div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {logs.filter(l => l.level === 'warn').length}
          </div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {logs.filter(l => l.level === 'info').length}
          </div>
          <div className="text-sm text-gray-600">Info</div>
        </div>
      </div>
    </div>
  )
}
