'use client'

import { ArrowLeft, Users, TrendingUp, Star, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/logo'
import { useState } from 'react'

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const communities = [
    { name: 'funny', members: '2.1M', description: 'Humor and memes', trending: true },
    { name: 'AskReddit', members: '45.2M', description: 'Ask questions, get answers', trending: true },
    { name: 'memes', members: '8.9M', description: 'Internet memes and humor', trending: false },
    { name: 'gaming', members: '12.3M', description: 'Video games and gaming culture', trending: true },
    { name: 'technology', members: '5.7M', description: 'Tech news and discussions', trending: false },
    { name: 'movies', members: '9.8M', description: 'Movie discussions and reviews', trending: false },
    { name: 'music', members: '7.2M', description: 'Music discussions and sharing', trending: false },
    { name: 'science', members: '4.1M', description: 'Scientific discussions and news', trending: false },
    { name: 'worldnews', members: '15.6M', description: 'Global news and events', trending: true },
    { name: 'pics', members: '18.4M', description: 'Interesting pictures', trending: false },
  ]

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <SimpleLogo size="md" />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <Users className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Communities
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Discover and join communities that match your interests
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Trending Communities */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Trending Communities
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunities.filter(c => c.trending).map((community) => (
              <Link
                key={community.name}
                href={`/r/${community.name}`}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
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
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {community.description}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-orange-500 font-medium">Trending</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Communities */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              All Communities
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunities.map((community) => (
              <Link
                key={community.name}
                href={`/r/${community.name}`}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
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
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {community.description}
                </p>
                {community.trending && (
                  <div className="mt-3 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-orange-500 font-medium">Trending</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Create Community CTA */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h2>
          <p className="text-orange-100 mb-6">
            Create your own community and start building your audience
          </p>
          <button className="bg-white text-orange-500 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Create Community
          </button>
        </div>
      </div>
    </div>
  )
}