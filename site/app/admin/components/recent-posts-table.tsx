'use client'

import { useEffect, useState } from 'react'

interface Post {
  id: string
  title: string
  subreddit: string
  status: string
  score: number
  createdAtFormatted: string
}

interface RecentPostsTableProps {
  posts: Post[]
}

export default function RecentPostsTable({ posts }: RecentPostsTableProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b dark:border-gray-800">
              <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">Title</th>
              <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">Subreddit</th>
              <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
              <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">Score</th>
              <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">Created</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, index) => (
              <tr key={`${post.id}-${index}`} className="border-b dark:border-gray-800">
                <td className="py-3">
                  <div className="max-w-xs truncate">{post.title}</div>
                </td>
                <td className="py-3">r/{post.subreddit}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      post.status === 'PUBLISHED' && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    } ${
                      post.status === 'READY' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                    } ${
                      post.status === 'FAILED' && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    } ${
                      post.status === 'NEW' && "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                    } ${
                      post.status === 'DOWNLOADING' && "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                    }`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="py-3">{post.score}</td>
                <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                  {post.createdAtFormatted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
