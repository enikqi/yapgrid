import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { recommendationEngine } from '@/lib/recommendation-engine'
import type { UserProfile } from '@/lib/event-tracker'

const logger = createLogger('api/recommendations')

// GET /api/recommendations - Get personalized post recommendations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const algorithm = searchParams.get('algo') as 'personal' | 'latest' | 'trending' || 'latest'
    const includeNsfw = searchParams.get('includeNsfw') === 'true'
    const hiddenPostIds = searchParams.get('hiddenPostIds')

    const skip = (page - 1) * pageSize

    // Get user session
    const session = await getServerSession(authOptions)
    let userProfile: UserProfile | null = null

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      if (user) {
        const profile = await prisma.userProfile.findUnique({
          where: { userId: user.id }
        })

        if (profile) {
          userProfile = JSON.parse(profile.profileData)
        }
      }
    }

    // If no user profile, create default one
    if (!userProfile) {
      userProfile = {
        subredditWeights: {},
        keywordWeights: {},
        authorWeights: {},
        interactionHistory: [],
        preferences: {
          personalizedFeed: true,
          diversityLevel: 0.3
        }
      }
    }

    // Build where clause for posts
    const where: any = {
      status: 'PUBLISHED'
    }

    if (!includeNsfw) {
      where.nsfw = false
    }

    // Filter out hidden posts
    if (hiddenPostIds) {
      const hiddenIds = hiddenPostIds.split(',').filter(id => id.trim())
      if (hiddenIds.length > 0) {
        where.id = { notIn: hiddenIds }
      }
    }

    // For PUBLISHED posts, only show posts with media (assets)
    // Text-only posts will only be visible on their specific subreddit pages
    where.assets = { some: {} } // Only posts with assets (media)

    // Get total count first
    const totalCount = await prisma.post.count({ where })

    // For proper infinite scroll, we need to fetch posts in a way that allows pagination
    // to continue. The recommendation engine may filter/reorder, so we fetch a larger
    // batch to ensure we have enough posts after filtering.
    // Fetch up to 1000 posts at a time (or all if less) to allow recommendation engine
    // to work with a good dataset, then paginate from the results
    const maxPostsToFetch = Math.min(1000, totalCount) // Fetch up to 1000 posts for recommendation engine
    
    const posts = await prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        author: true,
        subreddit: true,
        permalink: true,
        score: true,
        commentsCount: true,
        nsfw: true,
        createdUtc: true,
        publishedAt: true,
        assets: {
          select: {
            id: true,
            type: true,
            url: true,
            width: true,
            height: true,
            durationSec: true,
            storage: true,
            pathOrKey: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: maxPostsToFetch, // Fetch larger batch for recommendation engine
    })

    // Optimize asset URL transformation - batch process
    const transformedPosts = posts.map((post) => {
      const transformedAssets = post.assets.map((asset) => {
        if (asset.storage === 'LOCAL') {
          const filename = asset.pathOrKey.split(/[/\\]/).pop() || asset.pathOrKey
          asset.url = `/api/media/${encodeURIComponent(filename)}`
        }
        return asset
      })
      return {
        ...post,
        assets: transformedAssets,
      }
    })

    // Get recommendations
    let recommendedPosts
    if (algorithm === 'personal' && userProfile.preferences.personalizedFeed) {
      // Check if user has enough interaction history for personalization
      if (userProfile.interactionHistory.length < 5) {
        // Cold start - mix trending + recent + explore
        recommendedPosts = await recommendationEngine.coldStartRecommendations(
          transformedPosts,
          userProfile
        )
      } else {
        // Personalized recommendations
        recommendedPosts = await recommendationEngine.recommendPosts(
          transformedPosts,
          userProfile,
          'personal'
        )
      }
    } else {
      // Use specified algorithm
      recommendedPosts = await recommendationEngine.recommendPosts(
        transformedPosts,
        userProfile,
        algorithm
      )
    }

    // Apply pagination to recommended posts
    const paginatedPosts = recommendedPosts.slice(skip, skip + pageSize)
    
    // Calculate hasMore correctly:
    // 1. If we have more posts in the recommended list than what we're returning
    // 2. OR if we haven't fetched all posts yet (posts.length < totalCount)
    // 3. OR if we're at the end of fetched posts but totalCount shows more exist
    const hasMorePosts = 
      (skip + pageSize < recommendedPosts.length) || // More in current batch
      (posts.length >= maxPostsToFetch && skip + pageSize < totalCount) || // More in DB, need to fetch next batch
      (skip + pageSize < totalCount && recommendedPosts.length >= skip + pageSize) // More posts exist

    logger.info({ 
      algorithm, 
      page, 
      pageSize, 
      totalPosts: posts.length,
      recommendedCount: recommendedPosts.length,
      paginatedCount: paginatedPosts.length,
      hasMore: hasMorePosts,
      skip,
      totalCount,
      personalized: userProfile.preferences.personalizedFeed
    }, 'Generated post recommendations')

    // Add caching headers for better performance
    const response = NextResponse.json({
      success: true,
      data: {
        items: paginatedPosts,
        total: totalCount,
        page,
        pageSize,
        hasMore: hasMorePosts,
        algorithm,
        personalized: userProfile.preferences.personalizedFeed
      }
    })

    // Cache for 30 seconds for better performance
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    
    return response
  } catch (error) {
    logger.error({ error }, 'Failed to get recommendations')
    return NextResponse.json(
      { success: false, error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}
