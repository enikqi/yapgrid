'use client'

import { User } from 'lucide-react'

interface AdminHeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          YapGrid Admin
        </h1>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user?.email || 'Admin'}
          </span>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  )
}
