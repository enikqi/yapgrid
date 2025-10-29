import { NextRequest, NextResponse } from 'next/server'
import { redditClient } from '@/lib/reddit/client'
import { redditSessionManager } from '@/lib/reddit/session-manager'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/test-reddit')

// GET /api/test-reddit - Test Reddit post fetching with detailed info
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subreddit = searchParams.get('subreddit') || 'funny'
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Set session cookie if available
    const sessionConfig = await redditSessionManager.getSessionConfig()
    if (sessionConfig.enabled && sessionConfig.sessionCookie) {
      redditClient.setSessionCookie(sessionConfig.sessionCookie)
    }
    
    // Fetch posts
    const posts = await redditClient.fetchPosts({
      subreddits: [subreddit],
      sort: 'hot',
      time: 'day',
      limit,
      includeNsfw: false
    })
    
    // Get detailed info for each post
    const detailedPosts = posts.map(post => {
      const videoInfo = redditClient.getVideoInfo(post)
      return {
        id: post.id,
        title: post.title,
        url: post.url,
        score: post.score,
        is_video: post.is_video,
        has_media: !!post.media,
        has_reddit_video: !!post.media?.reddit_video,
        videoInfo: videoInfo ? {
          videoUrl: videoInfo.videoUrl,
          audioUrl: videoInfo.audioUrl,
          width: videoInfo.width,
          height: videoInfo.height,
          duration: videoInfo.duration,
          isGif: videoInfo.isGif,
        } : null,
        urlType: post.url.toLowerCase().includes('.mp4') ? 'direct_mp4' :
                 post.url.toLowerCase().includes('v.redd.it') ? 'vreddit' :
                 post.url.toLowerCase().includes('.gifv') ? 'gifv' :
                 post.url.toLowerCase().includes('reddit.com/video/') ? 'reddit_video' :
                 'other'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        subreddit,
        totalPosts: detailedPosts.length,
        posts: detailedPosts,
        summary: {
          direct_mp4: detailedPosts.filter(p => p.urlType === 'direct_mp4').length,
          vreddit: detailedPosts.filter(p => p.urlType === 'vreddit').length,
          gifv: detailedPosts.filter(p => p.urlType === 'gifv').length,
          reddit_video: detailedPosts.filter(p => p.urlType === 'reddit_video').length,
          other: detailedPosts.filter(p => p.urlType === 'other').length,
          with_video_info: detailedPosts.filter(p => p.videoInfo !== null).length,
        }
      }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to test Reddit fetching')
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch posts' 
      },
      { status: 500 }
    )
  }
}

