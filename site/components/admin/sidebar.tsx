'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Settings, 
  Film, 
  Upload, 
  BarChart3, 
  ListChecks,
  LogOut,
  Briefcase,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/posts', label: 'Posts', icon: Film },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Target },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/pinterest', label: 'Pinterest', icon: Upload },
  { href: '/admin/reddit', label: 'Reddit', icon: ListChecks },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r dark:border-gray-800">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
        
        <div className="pt-4 mt-4 border-t dark:border-gray-800">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}
