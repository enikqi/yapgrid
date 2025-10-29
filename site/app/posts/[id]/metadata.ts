import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'

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
    const description = `View this ${videoAsset ? 'video' : 'image'} post from ${post.subreddit} community on YapGrid. ${post.title}`
    
    const metadata: Metadata = {
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

    return metadata
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'YapGrid - Social Media Content Discovery',
      description: 'Discover the best social media content aggregated in one place.'
    }
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
