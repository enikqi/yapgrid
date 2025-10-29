'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Activity, AlertCircle, Clock, Settings, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface JobStatus {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error' | 'idle'
  lastRun?: string
  nextRun?: string
  description: string
  enabled: boolean
  jobCounts?: {
    pending: number
    active: number
    completed: number
    failed: number
  }
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [cronStatus, setCronStatus] = useState({
    scheduler: { status: 'unknown', pid: null },
    cronJobs: {
      autoIngest: false,
      autoProcessing: false,
      autoPosting: false,
      cleanup: false
    }
  })
  const [cronLoading, setCronLoading] = useState(false)

  useEffect(() => {
    fetchJobs()
    fetchCronStatus()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${window.location.origin}/api/admin/jobs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }

      const data = await response.json()

      if (data.success) {
        setJobs(data.data.jobs)
      } else {
        toast.error(data.error || 'Failed to load jobs')
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleJobAction = async (jobId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      setActionLoading(jobId)
      
      // Special handling for cleanup job
      if (jobId === 'cleanup' && action === 'start') {
        await handleCleanupAction()
        return
      }
      
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, action })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh jobs to get updated status
        await fetchJobs()
        toast.success(data.data.message)
      } else {
        toast.error(data.error || `Failed to ${action} job`)
      }
    } catch (error) {
      console.error(`Failed to ${action} job:`, error)
      toast.error(`Failed to ${action} job`)
    } finally {
      setActionLoading(null)
    }
  }

  const fetchCronStatus = async () => {
    try {
      const response = await fetch('/api/admin/cron')
      const data = await response.json()

      if (data.success) {
        setCronStatus(data.data)
      } else {
        toast.error('Failed to load cron status')
      }
    } catch (error) {
      console.error('Failed to fetch cron status:', error)
      toast.error('Failed to load cron status')
    }
  }

  const handleCronAction = async (action: string, jobType?: string) => {
    try {
      setCronLoading(true)
      
      const response = await fetch('/api/admin/cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, jobType })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.data.message)
        await fetchCronStatus() // Refresh status
      } else {
        toast.error(data.error || `Failed to ${action}`)
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
      toast.error(`Failed to ${action}`)
    } finally {
      setCronLoading(false)
    }
  }

  const handleCleanupAction = async () => {
    try {
      // First get cleanup statistics
      const statsResponse = await fetch('/api/admin/cleanup')
      const statsData = await statsResponse.json()
      
      if (!statsData.success) {
        toast.error('Failed to get cleanup statistics')
        return
      }

      const stats = statsData.data
      
      // Show confirmation dialog with cleanup options
      const confirmed = confirm(
        `Database Cleanup Options:\n\n` +
        `• Failed Posts: ${stats.database.failedPosts} posts\n` +
        `• Old Posts (>30 days): ${stats.database.oldPosts} posts\n` +
        `• Completed Jobs: ${stats.database.completedJobs} jobs\n` +
        `• Media Directory: ${stats.media.directorySizeFormatted}\n\n` +
        `This will clean up old and failed data. Continue?`
      )

      if (!confirmed) return

      // Perform cleanup
      const cleanupResponse = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cleanupFailedPosts: stats.cleanup.canCleanupFailedPosts,
          cleanupOldPosts: stats.cleanup.canCleanupOldPosts,
          cleanupCompletedJobs: stats.cleanup.canCleanupCompletedJobs,
          cleanupMedia: stats.cleanup.canCleanupMedia,
          olderThanDays: 30
        })
      })

      const cleanupData = await cleanupResponse.json()

      if (cleanupData.success) {
        const results = cleanupData.data
        toast.success(
          `Cleanup completed!\n` +
          `• Deleted ${results.failedPostsDeleted} failed posts\n` +
          `• Deleted ${results.oldPostsDeleted} old posts\n` +
          `• Deleted ${results.completedJobsDeleted} completed jobs\n` +
          `• Freed ${results.mediaSizeFreedFormatted} of media files`
        )
      } else {
        toast.error(cleanupData.error || 'Failed to perform cleanup')
      }
    } catch (error) {
      console.error('Failed to perform cleanup:', error)
      toast.error('Failed to perform cleanup')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-green-500" />
      case 'stopped':
        return <Pause className="w-4 h-4 text-gray-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'idle':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Settings className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'stopped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    }
  }

  const formatNextRun = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000)

    if (diffInSeconds < 0) {
      return 'Running now'
    } else if (diffInSeconds < 60) {
      return `In ${diffInSeconds}s`
    } else if (diffInSeconds < 3600) {
      return `In ${Math.floor(diffInSeconds / 60)}m`
    } else if (diffInSeconds < 86400) {
      return `In ${Math.floor(diffInSeconds / 3600)}h`
    } else {
      return `In ${Math.floor(diffInSeconds / 86400)}d`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Background Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor background processes
          </p>
        </div>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            {/* Job Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {job.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(job.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {job.description}
            </p>

            {/* Job Stats */}
            <div className="space-y-2 mb-4">
              {job.lastRun && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Run:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {formatTimeAgo(job.lastRun)}
                  </span>
                </div>
              )}
              {job.nextRun && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {formatNextRun(job.nextRun)}
                  </span>
                </div>
              )}
            </div>

            {/* Job Actions */}
            <div className="flex gap-2">
              {job.status === 'running' ? (
                <button
                  onClick={() => handleJobAction(job.id, 'stop')}
                  disabled={actionLoading === job.id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Pause className="w-4 h-4" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => handleJobAction(job.id, 'start')}
                  disabled={actionLoading === job.id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
              )}
              
              <button
                onClick={() => handleJobAction(job.id, 'restart')}
                disabled={actionLoading === job.id}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {jobs.filter(job => job.status === 'running').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Running Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {jobs.filter(job => job.status === 'idle').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Idle Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {jobs.filter(job => job.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Error Jobs</div>
          </div>
        </div>
      </div>

      {/* Cron Job Control */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cron Job Control
          </h2>
          <button
            onClick={fetchCronStatus}
            disabled={cronLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${cronLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Scheduler Status */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Background Scheduler</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status: <span className={`font-medium ${cronStatus.scheduler.status === 'running' ? 'text-green-600' : 'text-red-600'}`}>
                  {cronStatus.scheduler.status === 'running' ? 'Running' : 'Stopped'}
                </span>
                {cronStatus.scheduler.pid && (
                  <span className="ml-2 text-xs text-gray-500">(PID: {cronStatus.scheduler.pid})</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {cronStatus.scheduler.status === 'running' ? (
                <>
                  <button
                    onClick={() => handleCronAction('stop_scheduler')}
                    disabled={cronLoading}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Stop
                  </button>
                  <button
                    onClick={() => handleCronAction('restart_scheduler')}
                    disabled={cronLoading}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Restart
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleCronAction('start_scheduler')}
                  disabled={cronLoading}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Individual Cron Jobs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(cronStatus.cronJobs).map(([jobType, enabled]) => (
            <div key={jobType} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {jobType.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <button
                onClick={() => handleCronAction('toggle_job', jobType)}
                disabled={cronLoading}
                className={`px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  enabled 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Job Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {jobs.slice(0, 5).map((job) => (
            <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="flex items-center gap-3">
                {getStatusIcon(job.status)}
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {job.name}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {job.lastRun ? formatTimeAgo(job.lastRun) : 'Never'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}