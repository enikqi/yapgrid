import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const baseUrl = 'https://yapgrid.com'
    
    // Fetch recent posts with images
    const imagePosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        assets: {
          some: {
            type: 'THUMBNAIL'
          }
        }
      },
      select: {
        id: true,
        title: true,
        subreddit: true,
        updatedAt: true,
        assets: {
          where: {
            type: 'THUMBNAIL'
          },
          select: {
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

    // Generate image sitemap XML
    const imageEntries = imagePosts.map(post => {
      const images = post.assets.map(asset => {
        const imageUrl = asset.url.startsWith('http') 
          ? asset.url 
          : `${baseUrl}/api${asset.url}`
        
        return `
      <image:image>
        <image:loc>${imageUrl}</image:loc>
        <image:title><![CDATA[${post.title}]]></image:title>
        <image:caption><![CDATA[${post.title} from y/${post.subreddit}]]></image:caption>
      </image:image>`
      }).join('')

      return `
  <url>
    <loc>${baseUrl}/posts/${post.id}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>${images}
  </url>`
    }).join('')

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${imageEntries}
</urlset>`

    await prisma.$disconnect()

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating image sitemap:', error)
    await prisma.$disconnect()
    
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`,
      {
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    )
  }
}

