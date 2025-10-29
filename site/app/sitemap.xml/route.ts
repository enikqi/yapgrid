import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = 'https://yapgrid.com'
    
    // Get all published posts
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        publishedAt: true,
        updatedAt: true,
        subreddit: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 10000 // Limit to prevent huge sitemaps
    })

    // Get unique subreddits
    const subreddits = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        subreddit: true
      },
      distinct: ['subreddit']
    })

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Communities page -->
  <url>
    <loc>${baseUrl}/communities</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Admin page -->
  <url>
    <loc>${baseUrl}/admin</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <!-- Community pages -->
  ${subreddits.map(subreddit => `
  <url>
    <loc>${baseUrl}/communities/${subreddit.subreddit}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  
  <!-- Individual post pages -->
  ${posts.map(post => `
  <url>
    <loc>${baseUrl}/posts/${post.id}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache for 1 hour
      }
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
