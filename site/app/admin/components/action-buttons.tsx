'use client'

import { useState } from 'react'

export default function ActionButtons() {
  const [loading, setLoading] = useState<string | null>(null)

  const processPosts = async () => {
    try {
      setLoading('process')
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMinutes: 30, batchSize: 5 }),
      })
      const data = await response.json()
      if (data.success) {
        alert(data.data.message)
        window.location.reload()
      } else {
        alert(data.error || 'Failed to process posts')
      }
    } catch (error) {
      alert('Failed to process posts')
    } finally {
      setLoading(null)
    }
  }
  
  const publishPosts = async () => {
    try {
      setLoading('publish')
      const response = await fetch('/api/scheduler', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 3, forceAll: true }),
      })
      const data = await response.json()
      if (data.success) {
        alert(data.data.message)
        window.location.reload()
      } else {
        alert(data.error || 'Failed to publish posts')
      }
    } catch (error) {
      alert('Failed to publish posts')
    } finally {
      setLoading(null)
    }
  }
  
  const checkStatus = async () => {
    try {
      setLoading('status')
      const response = await fetch('/api/scheduler')
      const data = await response.json()
      if (data.success) {
        alert('Scheduler status updated')
      } else {
        alert('Failed to get scheduler status')
      }
    } catch (error) {
      alert('Failed to get scheduler status')
    } finally {
      setLoading(null)
    }
  }

  const clearAllPosts = async () => {
    if (!confirm('Are you sure you want to delete ALL posts, assets, and media files? This action cannot be undone!')) {
      return
    }
    
    try {
      setLoading('clear')
      const response = await fetch('/api/posts/clear', {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        alert(data.message)
        window.location.reload()
      } else {
        alert(data.error || 'Failed to clear posts')
      }
    } catch (error) {
      alert('Failed to clear posts')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-4 flex gap-3">
      <button 
        onClick={processPosts}
        disabled={loading === 'process'}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {loading === 'process' ? 'Processing...' : 'Process Posts'}
      </button>
      <button 
        onClick={publishPosts}
        disabled={loading === 'publish'}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
        </svg>
        {loading === 'publish' ? 'Publishing...' : 'Publish Posts'}
      </button>
      <button 
        onClick={checkStatus}
        disabled={loading === 'status'}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        {loading === 'status' ? 'Checking...' : 'Check Status'}
      </button>
      <button 
        onClick={clearAllPosts}
        disabled={loading === 'clear'}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
        {loading === 'clear' ? 'Clearing...' : 'Clear All Posts'}
      </button>
    </div>
  )
}

