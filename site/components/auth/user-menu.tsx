'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { User, Settings, LogOut, Plus, UserPlus, UserCircle, Edit3, Shield } from 'lucide-react'

interface UserData {
  id: string
  name: string
  username: string
  email: string
  image?: string
  karma: number
  isAdmin: boolean
}

export function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      setLoading(true)
      fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserData(data.data)
        } else {
          console.error('Failed to fetch user data:', data.error)
          // Fallback to session data if API fails
          setUserData({
            id: session.user.id || '',
            name: session.user.name || '',
            username: session.user.username || session.user.name?.toLowerCase().replace(/\s+/g, '_') || 'user',
            email: session.user.email || '',
            image: session.user.image,
            karma: 0,
            isAdmin: session.user.isAdmin || false,
          })
        }
      })
      .catch(error => {
        console.error('Failed to fetch user data:', error)
        // Fallback to session data if API fails
        setUserData({
          id: session.user.id || '',
          name: session.user.name || '',
          username: session.user.username || session.user.name?.toLowerCase().replace(/\s+/g, '_') || 'user',
          email: session.user.email || '',
          image: session.user.image,
          karma: 0,
          isAdmin: session.user.isAdmin || false,
        })
      })
      .finally(() => {
        setLoading(false)
      })
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
      >
        <User className="w-5 h-5 text-white" />
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {userData?.image ? (
          <img
            src={userData.image}
            alt={userData.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {userData?.name || session.user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  u/{userData?.username || 'user'}
                </p>
                {userData && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userData.karma} karma
                  </p>
                )}
              </div>
              
              <Link
                href={`/u/${userData?.username || 'user'}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <UserCircle className="w-4 h-4" />
                Profile
              </Link>
              
              <Link
                href="/submit"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Edit3 className="w-4 h-4" />
                Create Post
              </Link>
              
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              
              {userData?.isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    signOut({ callbackUrl: '/' })
                    setIsOpen(false)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
