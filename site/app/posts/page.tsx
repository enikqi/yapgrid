import { Metadata } from 'next'
import { PostsPageClient } from './posts-page-client'
import type { Post, Asset, PaginatedResponse } from '@/lib/types'

export const metadata: Metadata = {
  title: 'All Posts | YapGrid',
  description: 'Browse all posts from YapGrid communities. Discover trending content, videos, images, and discussions from thousands of subreddits.',
  keywords: [
    'posts', 'all posts', 'reddit posts', 'community posts', 
    'trending', 'videos', 'images', 'discussions', 'content'
  ],
  openGraph: {
    title: 'All Posts | YapGrid',
    description: 'Browse all posts from YapGrid communities. Discover trending content, videos, images, and discussions.',
    type: 'website',
    url: 'https://yapgrid.com/posts',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Posts | YapGrid',
    description: 'Browse all posts from YapGrid communities. Discover trending content, videos, images, and discussions.',
  },
  alternates: {
    canonical: 'https://yapgrid.com/posts',
  },
}

interface PostsPageProps {
  searchParams: {
    page?: string
    sort?: string
    type?: string
  }
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const page = parseInt(searchParams.page || '1')
  const sort = searchParams.sort || 'latest'
  const type = searchParams.type || 'all'
  
  // Structured data for the posts page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "All Posts - YapGrid",
    "description": "Browse all posts from YapGrid communities. Discover trending content, videos, images, and discussions from thousands of subreddits.",
    "url": "https://yapgrid.com/posts",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Posts Collection",
      "description": "Collection of all posts from YapGrid communities"
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "YapGrid",
      "url": "https://yapgrid.com"
    }
  }

  try {
    // Fetch posts based on parameters
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: '20',
      status: 'PUBLISHED',
      includeNsfw: 'false'
    })

    if (sort === 'trending') {
      params.append('sortBy', 'score')
    } else if (sort === 'popular') {
      params.append('sortBy', 'upvotes')
    }

    if (type === 'videos') {
      params.append('assetType', 'VIDEO')
    } else if (type === 'images') {
      params.append('assetType', 'THUMBNAIL')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/posts?${params}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch posts')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error('Failed to fetch posts')
    }

    const paginatedData = data.data as PaginatedResponse<Post & { assets: Asset[] }>
    const posts = paginatedData.items

    return (
      <>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        <PostsPageClient 
          posts={posts} 
          paginatedData={paginatedData}
          page={page}
          sort={sort}
          type={type}
        />
      </>
    )
  } catch (error) {
    console.error('Error loading posts:', error)
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Error Loading Posts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading the posts. Please try again later.
          </p>
          <a 
            href="/"
            className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }
}
