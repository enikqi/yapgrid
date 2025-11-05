'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/logo'
import { UserMenu } from '@/components/auth/user-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Search, Menu, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface MainHeaderProps {
  onMobileMenuToggle?: () => void
  onSearchClick?: () => void
  showSearch?: boolean
}

export function MainHeader({ onMobileMenuToggle, onSearchClick, showSearch = true }: MainHeaderProps) {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    onMobileMenuToggle?.()
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* Left side: Menu + Logo + Desktop Nav */}
        <div className="flex items-center gap-2 xl:gap-4 flex-shrink-0">
          {/* Mobile menu button */}
          {onMobileMenuToggle && (
            <button
              onClick={handleMobileMenuToggle}
              className="xl:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}

          <SimpleLogo size="md" />
          
          <nav className="hidden xl:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-orange-500">
              Home
            </Link>
            {(session?.user as any)?.isAdmin && (
              <Link href="/admin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Desktop Search bar */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search YapGrid..."
                onClick={onSearchClick}
                readOnly
                className="w-full pl-10 pr-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-gray-100 cursor-pointer"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>
        )}

        {/* Right side: Mobile Search + Notifications + User Menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Icon */}
          {showSearch && (
            <button
              onClick={onSearchClick}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

