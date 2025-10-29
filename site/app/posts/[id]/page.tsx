import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { PostCard } from '@/components/post-card'
import { generatePostStructuredData, generateBreadcrumbStructuredData } from '@/lib/structured-data'
import type { Post, Asset } from '@/lib/types'

interface PostPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        assets: {
          select: {
            type: true,
            url: true,
            width: true,
            height: true
          }
        }
      }
    })

    if (!post) {
      return {
        title: 'Post Not Found - YapGrid',
        description: 'The requested post could not be found.'
      }
    }

    const imageAsset = post.assets.find(a => a.type === 'THUMBNAIL')
    const videoAsset = post.assets.find(a => a.type === 'VIDEO')
    
    const title = `${post.title} - ${post.subreddit} | YapGrid`
    const description = `View this ${videoAsset ? 'video' : 'image'} post from ${post.subreddit} community on YapGrid. ${post.title}. Posted by ${post.author}.`
    
    return {
      title,
      description,
      keywords: [
        post.subreddit,
        'yapgrid',
        videoAsset ? 'video' : 'image',
        'social media',
        'content',
        'community'
      ],
      authors: [{ name: post.author }],
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: post.publishedAt?.toISOString(),
        authors: [post.author],
        section: post.subreddit,
        tags: [post.subreddit, 'social media', 'community'],
        ...(imageAsset && {
          images: [{
            url: imageAsset.url,
            width: imageAsset.width || 1200,
            height: imageAsset.height || 630,
            alt: post.title
          }]
        })
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(imageAsset && {
          images: [imageAsset.url]
        })
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      alternates: {
        canonical: `https://yapgrid.com/posts/${post.id}`
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'YapGrid - Social Media Content Discovery',
      description: 'Discover the best social media content aggregated in one place.'
    }
  }
}

export default async function PostPage({ params }: PostPageProps) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        assets: true
      }
    })

    if (!post) {
      notFound()
    }

    const structuredData = generatePostStructuredData(post as Post & { assets: Asset[] })
    const breadcrumbData = generateBreadcrumbStructuredData(post)

    return (
      <>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbData)
          }}
        />

        <div className="min-h-screen bg-gray-50">
          {/* Breadcrumb */}
          <nav className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="max-w-4xl mx-auto">
              <ol className="flex items-center space-x-2 text-sm text-gray-600">
                <li>
                  <a href="/" className="hover:text-gray-900">
                    Home
                  </a>
                </li>
                <li className="text-gray-400">/</li>
                <li>
                  <a href={`/communities/${post.subreddit}`} className="hover:text-gray-900">
                    {post.subreddit}
                  </a>
                </li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-900 font-medium truncate">
                  {post.title}
                </li>
              </ol>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-4xl mx-auto px-4 py-8">
            <PostCard 
              post={post as Post & { assets: Asset[] }} 
              showComments={true}
            />
          </main>
        </div>
      </>
    )
  } catch (error) {
    console.error('Error loading post:', error)
    notFound()
  }
}

// Generate static params for popular posts
export async function generateStaticParams() {
  try {
    const popularPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        score: { gte: 100 } // Only high-scoring posts
      },
      select: {
        id: true
      },
      take: 1000 // Generate static pages for top 1000 posts
    })

    return popularPosts.map(post => ({
      id: post.id
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}
