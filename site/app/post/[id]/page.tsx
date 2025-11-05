import { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { PostPageClient } from './post-page-client'
import { prisma } from '@/lib/db/prisma'


// Generate metadata for each post
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // Extract the post ID from params
    const postId = params.id
    
    // Direct database query to avoid infinite loops
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { 
        assets: true
      }
    })
    
    if (!post) {
      return {
        title: 'Post Not Found | YapGrid',
        description: 'The requested post could not be found.'
      }
    }
    
    const imageAsset = post.assets?.find(asset => asset.type === 'THUMBNAIL')
    const videoAsset = post.assets?.find(asset => asset.type === 'VIDEO')
    
    // Determine post type and content
    const title = post.title || `Post by u/${post.author} | YapGrid`
    const description = post.title || 'Check out this post on YapGrid'
    const postUrl = `https://yapgrid.com/post/${params.id}`
    
    // Build base metadata
    const metadata: Metadata = {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        siteName: 'YapGrid',
        url: postUrl,
      },
      twitter: {
        card: videoAsset ? 'player' : 'summary_large_image',
        title,
        description,
        creator: `@${post.author}`,
      },
      alternates: {
        canonical: postUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        }
      },
      keywords: [
        'reddit', 'post', 'community', 'discussion', 
        post.subreddit || 'social', 'social media'
      ],
      authors: [{ name: `u/${post.author}` }]
    }
    
    // Add image if available
    if (imageAsset?.url) {
      const imageUrl = new URL(imageAsset.url, 'https://yapgrid.com').toString()
      metadata.openGraph!.images = [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: title,
      }]
      metadata.twitter!.images = [imageUrl]
    }
    
    // Add video if available
    if (videoAsset?.url) {
      metadata.openGraph!.type = 'video.other'
      metadata.openGraph!.videos = [{
        url: videoAsset.url,
        width: 1280,
        height: 720,
        type: 'video/mp4'
      }]
      
      if (metadata.twitter) {
        metadata.twitter.players = [{
          playerUrl: videoAsset.url,
          width: 1280,
          height: 720,
        }]
      }
    }
    
    return metadata
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Error | YapGrid',
      description: 'An error occurred while loading this post.'
    }
  }
}

// Generate static params for popular posts
export async function generateStaticParams() {
  try {
    // Get the top 100 most recent published posts
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true }
    })
    
    return posts.map(post => ({
      id: post.id,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default async function PostPage({ params }: { params: { id: string } }) {
  try {
    // Extract the post ID from params
    const postId = params.id
    
    // Get the post with its assets
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        assets: true
      }
    })
    
    if (!post) {
      notFound()
    }
    
    const imageAsset = post.assets.find(asset => asset.type === 'THUMBNAIL')
    const videoAsset = post.assets.find(asset => asset.type === 'VIDEO')
    
    // Structured data for the specific post
    const structuredData = {
      "@context": "https://schema.org",
      "@type": videoAsset ? "VideoObject" : imageAsset ? "ImageObject" : "Article",
      "headline": post.title || 'YapGrid Post',
      "description": post.title || 'Check out this post on YapGrid',
      "author": {
        "@type": "Person",
        "name": `u/${post.author}`,
        "url": `https://yapgrid.com/u/${post.author}`
      },
      "publisher": {
        "@type": "Organization",
        "name": "YapGrid",
        "url": "https://yapgrid.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://yapgrid.com/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://yapgrid.com/post/${post.id}`
      },
      "about": {
        "@type": "Thing",
        "name": post.subreddit,
        "url": `https://yapgrid.com/r/${post.subreddit}`
      }
    }
    
    return (
      <>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        <PostPageClient post={post} />
      </>
    )
  } catch (error) {
    console.error('Error loading post:', error)
    notFound()
  }
}
