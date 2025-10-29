import { prisma } from '@/lib/db/prisma'
import { getAllQueueStats } from '@/lib/queue'
import { 
  Film, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Clock,
  TrendingUp,
  Download,
  Share2,
  Play,
  Settings,
  Edit3,
  Zap
} from 'lucide-react'
import ActionButtons from './components/action-buttons'
import RecentPostsTable from './components/recent-posts-table'
import AutoPostingConfigNew from './components/auto-posting-config-new'
import AutoProcessingConfig from './components/auto-processing-config'
import TitleOptimization from './components/title-optimization'

// Helper to use cn function
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

async function getStats() {
  try {
    const [
      totalPosts,
      publishedPosts,
      readyPosts,
      failedPosts,
      recentPosts,
      queueStats
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'READY' } }),
      prisma.post.count({ where: { status: 'FAILED' } }),
      prisma.post.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { assets: true },
      }),
      getAllQueueStats().catch(() => ({
        media: { active: 0, waiting: 0, failed: 0 },
        publish: { active: 0, waiting: 0, failed: 0 },
        ingest: { active: 0, waiting: 0, failed: 0 },
      })),
    ])

    // Ensure consistent data structure for hydration
    const safeRecentPosts = recentPosts.map(post => ({
      id: post.id,
      title: post.title || '',
      subreddit: post.subreddit || '',
      status: post.status || 'NEW',
      score: post.score || 0,
      createdAt: post.createdAt,
      createdAtFormatted: post.createdAt ? post.createdAt.toISOString().split('T')[0] : 'N/A',
    }))

    return {
      totalPosts,
      publishedPosts,
      readyPosts,
      failedPosts,
      recentPosts: safeRecentPosts,
      queueStats,
    }
  } catch (error) {
    console.error('Error getting stats:', error)
    return {
      totalPosts: 0,
      publishedPosts: 0,
      readyPosts: 0,
      failedPosts: 0,
      recentPosts: [],
      queueStats: {
        media: { active: 0, waiting: 0, failed: 0 },
        publish: { active: 0, waiting: 0, failed: 0 },
        ingest: { active: 0, waiting: 0, failed: 0 },
      },
    }
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const statCards = [
    {
      label: 'Total Posts',
      value: stats.totalPosts,
      icon: Film,
      color: 'blue',
    },
    {
      label: 'Published',
      value: stats.publishedPosts,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Ready to Publish',
      value: stats.readyPosts,
      icon: Clock,
      color: 'yellow',
    },
    {
      label: 'Failed',
      value: stats.failedPosts,
      icon: AlertCircle,
      color: 'red',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overview of your YapGrid system
        </p>
        
        {/* Action Buttons */}
        <ActionButtons />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    stat.color === 'blue' && "bg-blue-100 dark:bg-blue-900/20",
                    stat.color === 'green' && "bg-green-100 dark:bg-green-900/20",
                    stat.color === 'yellow' && "bg-yellow-100 dark:bg-yellow-900/20",
                    stat.color === 'red' && "bg-red-100 dark:bg-red-900/20"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      stat.color === 'blue' && "text-blue-600 dark:text-blue-400",
                      stat.color === 'green' && "text-green-600 dark:text-green-400",
                      stat.color === 'yellow' && "text-yellow-600 dark:text-yellow-400",
                      stat.color === 'red' && "text-red-600 dark:text-red-400"
                    )}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Queue Status */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Queue Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              Media Processing
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active:</span>
                <span className="font-medium">{stats.queueStats.media.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Waiting:</span>
                <span className="font-medium">{stats.queueStats.media.waiting}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                <span className="font-medium text-red-600">{stats.queueStats.media.failed}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              Publishing
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active:</span>
                <span className="font-medium">{stats.queueStats.publish.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Waiting:</span>
                <span className="font-medium">{stats.queueStats.publish.waiting}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                <span className="font-medium text-red-600">{stats.queueStats.publish.failed}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reddit Ingest
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active:</span>
                <span className="font-medium">{stats.queueStats.ingest.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Waiting:</span>
                <span className="font-medium">{stats.queueStats.ingest.waiting}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                <span className="font-medium text-red-600">{stats.queueStats.ingest.failed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Processing Configuration */}
      <AutoProcessingConfig />

      {/* Auto-Posting Configuration */}
      <AutoPostingConfigNew />

      {/* Title Optimization */}
      <TitleOptimization />

      {/* Recent Posts */}
      <RecentPostsTable posts={stats.recentPosts} />

    </div>
  )
}
