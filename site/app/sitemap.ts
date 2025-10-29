import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://yapgrid.com'
  
  try {
    // Static pages
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/trending`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/popular`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/all`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/communities`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/posts`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/help`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
    ]

    // Fetch recent posts (last 1000 for sitemap)
    const recentPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        assets: {
          select: {
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000 // Limit to 1000 most recent posts for sitemap
    })

    // Create post pages with different priorities based on content type
    const postPages = recentPosts.map(post => {
      const hasVideo = post.assets.some(asset => asset.type === 'VIDEO')
      const hasImage = post.assets.some(asset => asset.type === 'THUMBNAIL')
      
      // Higher priority for video and image posts
      let priority = 0.6
      if (hasVideo) priority = 0.8
      else if (hasImage) priority = 0.7
      
      return {
        url: `${baseUrl}/post/${post.id}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'weekly' as const,
        priority,
      }
    })

    // Dynamic community pages
    const popularCommunities = [
      'confidentlyincorrect',
      'ShitAmericansSay', 
      'Nicegirls',
      'nextfuckinglevel',
      'blackmagicfuckery',
      'TikTokCringe',
      'AskReddit',
      'funny',
      'memes',
      'gaming',
      'technology',
      'worldnews',
      'science',
      'movies',
      'music'
    ]

    const communityPages = popularCommunities.map(community => ({
      url: `${baseUrl}/r/${community}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...postPages, ...communityPages]
    
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Fallback to static pages only if database fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/trending`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/popular`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      },
    ]
  } finally {
    await prisma.$disconnect()
  }
}
