'use client'

import { useEffect } from 'react'
// import { ProcessPostsButton, PublishPostsButton, SchedulerStatus } from './action-buttons'

export default function ActionButtonsLoader() {
  useEffect(() => {
    const container = document.getElementById('action-buttons')
    if (container) {
      // Create a temporary div to render the components
      const tempDiv = document.createElement('div')
      tempDiv.className = 'flex gap-3'
      
      // This is a workaround - we'll use a different approach
      container.innerHTML = `
        <button onclick="processPosts()" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Process Posts
        </button>
        <button onclick="publishPosts()" class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
          </svg>
          Publish Posts
        </button>
        <button onclick="checkStatus()" class="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Check Status
        </button>
      `
      
      // Add global functions
      ;(window as any).processPosts = async () => {
        try {
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
        }
      }
      
      ;(window as any).publishPosts = async () => {
        try {
          const response = await fetch('/api/scheduler', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batchSize: 3, forceAll: false }),
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
        }
      }
      
      ;(window as any).checkStatus = async () => {
        try {
          const response = await fetch('/api/scheduler')
          const data = await response.json()
          if (data.success) {
            alert('Scheduler status updated')
          } else {
            alert('Failed to get scheduler status')
          }
        } catch (error) {
          alert('Failed to get scheduler status')
        }
      }
    }
  }, [])

  return null
}
