import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const baseUrl = 'https://yapgrid.com'
    
    // Fetch recent posts with videos
    const videoPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        assets: {
          some: {
            type: 'VIDEO'
          }
        }
      },
      select: {
        id: true,
        title: true,
        subreddit: true,
        updatedAt: true,
        publishedAt: true,
        assets: {
          where: {
            OR: [
              { type: 'VIDEO' },
              { type: 'THUMBNAIL' }
            ]
          },
          select: {
            type: true,
            url: true,
            width: true,
            height: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50000 // Google allows up to 50k URLs per sitemap
    })

    // Generate video sitemap XML
    const videoEntries = videoPosts.map(post => {
      const videoAsset = post.assets.find(a => a.type === 'VIDEO')
      const thumbnailAsset = post.assets.find(a => a.type === 'THUMBNAIL')
      
      if (!videoAsset) return ''

      // Get video content URL (actual video file)
      const videoUrl = videoAsset.url.startsWith('http') 
        ? videoAsset.url 
        : `${baseUrl}/api${videoAsset.url}`
      
      // Get thumbnail URL only if it exists
      const thumbnailUrl = thumbnailAsset 
        ? (thumbnailAsset.url.startsWith('http') 
            ? thumbnailAsset.url 
            : `${baseUrl}/api${thumbnailAsset.url}`)
        : null

      // Build thumbnail tag only if URL exists
      const thumbnailTag = thumbnailUrl 
        ? `      <video:thumbnail_loc>${thumbnailUrl}</video:thumbnail_loc>`
        : ''

      return `
  <url>
    <loc>${baseUrl}/posts/${post.id}</loc>
    <video:video>
${thumbnailTag}
      <video:title><![CDATA[${post.title}]]></video:title>
      <video:description><![CDATA[${post.title} - Watch on YapGrid from y/${post.subreddit}]]></video:description>
      <video:content_loc>${videoUrl}</video:content_loc>
      <video:publication_date>${(post.publishedAt || post.updatedAt).toISOString()}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
      <video:uploader info="${baseUrl}/y/${post.subreddit}">y/${post.subreddit}</video:uploader>
      <video:live>no</video:live>
    </video:video>
  </url>`
    }).filter(Boolean).join('')

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${videoEntries}
</urlset>`

    await prisma.$disconnect()

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating video sitemap:', error)
    await prisma.$disconnect()
    
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
</urlset>`,
      {
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    )
  }
}

