'use client'

import React, { useState, useEffect } from 'react'
import { Users, TrendingUp, Zap, HelpCircle, Flag, Heart, Sparkles, Smartphone, UserPlus, UserMinus } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

interface PersonalizedCommunity {
  subreddit: string
  score: number
  totalPosts: number
  avgScore: number
  recentPostsCount: number
  recentAvgScore: number
  userInteractionCount?: number
}

interface PersonalizedCommunitiesProps {
  algorithm?: 'trending' | 'popular' | 'hot'
  limit?: number
  onAlgorithmChange?: (algorithm: 'trending' | 'popular' | 'hot') => void
}

export default function PersonalizedCommunities({ 
  algorithm = 'trending', 
  limit = 6,
  onAlgorithmChange
}: PersonalizedCommunitiesProps) {
  const { data: session } = useSession()
  const [communities, setCommunities] = useState<PersonalizedCommunity[]>([])
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch(`/api/communities/personalized?algorithm=${algorithm}&limit=${limit}`)
        const data = await response.json()
        
        if (data.success) {
          setCommunities(data.data.communities)
        }
      } catch (error) {
        console.error('Failed to fetch personalized communities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCommunities()
  }, [algorithm, limit])

  // Fetch user subscriptions when user is authenticated with debouncing
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!session?.user?.email) return

      try {
        const response = await fetch('/api/subscriptions')
        const data = await response.json()
        
        if (data.success) {
          setSubscriptions(new Set(data.data.subscriptions))
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error)
      }
    }

    // Debounce subscription fetching
    const timeoutId = setTimeout(() => {
      fetchSubscriptions()
    }, 300) // Wait 300ms before fetching subscriptions

    return () => clearTimeout(timeoutId)
  }, [session])

  const handleJoinLeave = async (subreddit: string, isSubscribed: boolean) => {
    if (!session?.user?.email) {
      toast.error('Please sign in to join communities')
      return
    }

    const action = isSubscribed ? 'leave' : 'join'
    
    // Optimistic update - update UI immediately
    if (action === 'join') {
      setSubscriptions(prev => new Set([...prev, subreddit]))
    } else {
      setSubscriptions(prev => {
        const newSet = new Set(prev)
        newSet.delete(subreddit)
        return newSet
      })
    }
    
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subreddit,
          action
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${action === 'join' ? 'Joined' : 'Left'} r/${subreddit}`)
      } else {
        // Revert optimistic update on failure
        if (action === 'join') {
          setSubscriptions(prev => {
            const newSet = new Set(prev)
            newSet.delete(subreddit)
            return newSet
          })
        } else {
          setSubscriptions(prev => new Set([...prev, subreddit]))
        }
        toast.error(data.error || 'Failed to update subscription')
      }
    } catch (error) {
      // Revert optimistic update on error
      if (action === 'join') {
        setSubscriptions(prev => {
          const newSet = new Set(prev)
          newSet.delete(subreddit)
          return newSet
        })
      } else {
        setSubscriptions(prev => new Set([...prev, subreddit]))
      }
      console.error('Failed to update subscription:', error)
      toast.error('Failed to update subscription')
    }
  }

  const getSubredditIcon = (subreddit: string) => {
    const icons: { [key: string]: any } = {
      'confidentlyincorrect': HelpCircle,
      'ShitAmericansSay': Flag,
      'Nicegirls': Heart,
      'nextfuckinglevel': Zap,
      'blackmagicfuckery': Sparkles,
      'TikTokCringe': Smartphone,
      'funny': Users,
      'Funnymemes': Users,
      'whenthe': Users,
      'BeAmazed': Users,
      'cats': Users,
      'dogs': Users,
      'Awww': Users,
      'FunnyAnimals': Users,
      'HumorInPoorTaste': Users,
      'ImTheMainCharacter': Users,
      'therewasanattempt': Users,
      'CringeTikToks': Users,
      'PeterExplainsTheJoke': Users,
      'ExplainTheJoke': Users
    }
    return icons[subreddit] || Users
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const getAlgorithmTitle = () => {
    switch (algorithm) {
      case 'trending': return 'Trending Communities'
      case 'popular': return 'Popular Communities'
      case 'hot': return 'Hot Communities'
      default: return 'Communities'
    }
  }

  const getAlgorithmIcon = () => {
    switch (algorithm) {
      case 'trending': return TrendingUp
      case 'popular': return Users
      case 'hot': return Zap
      default: return Users
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Communities</h3>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {React.createElement(getAlgorithmIcon(), { className: "w-4 h-4 text-orange-500" })}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{getAlgorithmTitle()}</h3>
        </div>
        <Link href="/communities" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
          See all
        </Link>
      </div>
      
      <div className="space-y-2">
        {communities.length > 0 ? (
          communities.map((community) => {
            const IconComponent = getSubredditIcon(community.subreddit)
            const isSubscribed = subscriptions.has(community.subreddit)
            
            return (
              <div 
                key={community.subreddit} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <Link 
                  href={`/r/${community.subreddit}`} 
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <IconComponent className="w-5 h-5 text-orange-500 group-hover:text-orange-600 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      r/{community.subreddit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatNumber(community.totalPosts)} posts
                      {community.recentPostsCount > 0 && (
                        <span className="ml-1">
                          • {formatNumber(community.recentPostsCount)} recent
                        </span>
                      )}
                      {community.userInteractionCount && community.userInteractionCount > 0 && (
                        <span className="ml-1 text-orange-500">
                          • {community.userInteractionCount} interactions
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(community.avgScore)}
                    </span>
                  </div>
                </Link>
                
                {/* Join/Leave Button */}
                {session?.user?.email && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleJoinLeave(community.subreddit, isSubscribed)
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      isSubscribed
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {isSubscribed ? (
                      <>
                        <UserMinus className="w-3 h-3" />
                        Leave
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        Join
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              No communities found
            </div>
          </div>
        )}
      </div>

      {/* Algorithm switcher */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {[
            { key: 'trending', label: 'Trending', icon: TrendingUp },
            { key: 'popular', label: 'Popular', icon: Users },
            { key: 'hot', label: 'Hot', icon: Zap }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                if (onAlgorithmChange) {
                  onAlgorithmChange(key as 'trending' | 'popular' | 'hot')
                }
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                algorithm === key
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
