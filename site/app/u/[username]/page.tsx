'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Settings, User, Calendar, Award, MessageCircle, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string
  username: string
  bio?: string
  karma: number
  createdAt: string
  postsCount: number
  commentsCount: number
  isAdmin: boolean
}

export default function UserProfilePage() {
  const { data: session } = useSession()
  const params = useParams()
  const username = params.username as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${username}`)
        const data = await response.json()
        
        if (data.success) {
          setProfile(data.data)
        } else {
          toast.error('User not found')
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username])

  const handleFollow = async () => {
    if (!session) {
      toast.error('Please sign in to follow users')
      return
    }

    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsFollowing(!isFollowing)
        toast.success(isFollowing ? 'Unfollowed' : 'Following')
      } else {
        toast.error(data.error || 'Failed to follow user')
      }
    } catch (error) {
      console.error('Follow error:', error)
      toast.error('Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">User not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The user you're looking for doesn't exist.</p>
          <Link href="/" className="text-orange-500 hover:text-orange-600">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = session?.user?.username === username

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">u/{profile.username}</h1>
          </div>
          {isOwnProfile && (
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  u/{profile.username}
                </p>
                {profile.bio && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {profile.bio}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    <span>{profile.karma} karma</span>
                  </div>
                </div>
              </div>
            </div>
            
            {!isOwnProfile && session && (
              <button
                onClick={handleFollow}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  isFollowing
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-900 dark:text-gray-100">Posts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {profile.postsCount}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-900 dark:text-gray-100">Comments</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {profile.commentsCount}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-900 dark:text-gray-100">Karma</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {profile.karma}
            </p>
          </div>
        </div>

        {/* Posts and Comments Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button className="py-4 px-1 border-b-2 border-orange-500 text-orange-500 font-medium">
                Posts
              </button>
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                Comments
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No posts yet. Posts will appear here when {profile.username} creates them.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
