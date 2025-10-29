import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/search')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const includeNsfw = searchParams.get('includeNsfw') === 'true'

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 })
    }

    const searchTerm = query.trim()
    const offset = (page - 1) * pageSize

    // Build search conditions
    const where: any = {
      status: 'PUBLISHED',
      assets: {
        some: {} // Only posts with assets
      }
    }

    if (!includeNsfw) {
      where.nsfw = false
    }

    // Search in multiple fields (SQLite compatible)
    where.OR = [
      {
        title: {
          contains: searchTerm
        }
      },
      {
        subreddit: {
          contains: searchTerm
        }
      },
      {
        author: {
          contains: searchTerm
        }
      }
    ]

    // Get total count for pagination
    const totalCount = await prisma.post.count({ where })

    // Get posts with assets
    const posts = await prisma.post.findMany({
      where,
      include: {
        assets: {
          orderBy: {
            type: 'asc' // Get THUMBNAIL first, then VIDEO
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip: offset,
      take: pageSize
    })
    
    // Log first result for debugging
    if (posts.length > 0) {
      console.log('First search result:', {
        title: posts[0].title,
        assets: posts[0].assets,
        preview: posts[0].preview
      })
    }

    const hasMore = offset + pageSize < totalCount

    logger.info({
      query: searchTerm,
      totalCount,
      page,
      pageSize,
      resultsCount: posts.length
    }, 'Search completed')

    return NextResponse.json({
      success: true,
      data: {
        items: posts,
        total: totalCount,
        page,
        pageSize,
        hasMore,
        query: searchTerm
      }
    })

  } catch (error) {
    logger.error({ error }, 'Search failed')
    return NextResponse.json({
      success: false,
      error: 'Search failed'
    }, { status: 500 })
  }
}
