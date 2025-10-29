'use client'

import { ArrowLeft, TrendingUp, Flame, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/logo'
import { useState, useEffect } from 'react'

export default function TrendingPage() {
  const [trendingPosts, setTrendingPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading trending posts
    const loadTrendingPosts = async () => {
      setLoading(true)
      // In a real app, this would fetch from an API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTrendingPosts([
        {
          id: '1',
          title: 'Amazing sunset from my window',
          subreddit: 'pics',
          score: 15420,
          commentsCount: 234,
          author: 'photographer123',
          timeAgo: '2 hours ago',
          trending: true
        },
        {
          id: '2',
          title: 'This AI-generated artwork is incredible',
          subreddit: 'art',
          score: 12890,
          commentsCount: 456,
          author: 'artlover',
          timeAgo: '3 hours ago',
          trending: true
        },
        {
          id: '3',
          title: 'Just finished building my first PC',
          subreddit: 'buildapc',
          score: 9876,
          commentsCount: 189,
          author: 'pcbuilder',
          timeAgo: '4 hours ago',
          trending: true
        }
      ])
      setLoading(false)
    }

    loadTrendingPosts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <SimpleLogo size="md" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <TrendingUp className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Trending Now
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover what&apos;s hot and happening across all communities
          </p>
        </div>

        {/* Trending Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">1.2M</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Posts Today</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">45K</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">2.3M</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Comments Today</div>
          </div>
        </div>

        {/* Trending Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Hot Posts
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading trending posts...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {trendingPosts.map((post, index) => (
                <div key={post.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full font-medium">
                          TRENDING
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          r/{post.subreddit}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-orange-500 cursor-pointer">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>u/{post.author}</span>
                        <span>{post.timeAgo}</span>
                        <span>{post.score.toLocaleString()} points</span>
                        <span>{post.commentsCount} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending Communities */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Trending Communities
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: 'funny', members: '2.1M', growth: '+12%' },
                { name: 'AskReddit', members: '45.2M', growth: '+8%' },
                { name: 'gaming', members: '12.3M', growth: '+15%' },
                { name: 'worldnews', members: '15.6M', growth: '+22%' },
                { name: 'memes', members: '8.9M', growth: '+18%' },
                { name: 'technology', members: '5.7M', growth: '+9%' }
              ].map((community) => (
                <Link
                  key={community.name}
                  href={`/r/${community.name}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">r/</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        r/{community.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {community.members} members
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-green-500 font-medium">
                      {community.growth}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">this week</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
