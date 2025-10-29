'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

export default function CommunityRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const subreddit = params.subreddit as string

  useEffect(() => {
    // Redirect to the correct route format
    if (subreddit) {
      router.replace(`/r/${subreddit}`)
    }
  }, [subreddit, router])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to r/{subreddit}...</p>
      </div>
    </div>
  )
}
