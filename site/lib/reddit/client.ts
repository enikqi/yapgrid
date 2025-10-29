import 'server-only'
import Snoowrap from 'snoowrap'
import axios from 'axios'
import { config } from '@/lib/config'
import { createLogger } from '@/lib/logger'
import { redditCache } from '@/lib/reddit/cache'
import type { RedditPost, RedditVideoInfo } from '@/lib/types'

const logger = createLogger('reddit-client')

export class RedditClient {
  private snoowrap?: Snoowrap
  private useSessionCookie: boolean = false
  private sessionCookie?: string

  constructor() {
    // Initialize Snoowrap if OAuth credentials are available
    if (config.REDDIT_CLIENT_ID && config.REDDIT_CLIENT_SECRET) {
      this.snoowrap = new Snoowrap({
        userAgent: 'PinReddit/1.0.0',
        clientId: config.REDDIT_CLIENT_ID,
        clientSecret: config.REDDIT_CLIENT_SECRET,
        refreshToken: config.REDDIT_REFRESH_TOKEN,
      })
      
      // Configure snoowrap
      this.snoowrap.config({
        requestDelay: 1000,
        requestTimeout: 30000,
        continueAfterRatelimitError: false,
        warnings: false,
      })
    }
    
    // Enable session cookie mode if configured
    if (config.REDDIT_SESSION_COOKIE) {
      this.enableSessionCookie()
    }
  }

  /**
   * Enable session cookie mode (only use when explicitly enabled by admin)
   */
  enableSessionCookie() {
    if (config.REDDIT_SESSION_COOKIE) {
      this.useSessionCookie = true
      this.sessionCookie = config.REDDIT_SESSION_COOKIE
      logger.warn('Session cookie mode enabled - ensure compliance with Reddit ToS')
    }
  }

  /**
   * Set session cookie for testing
   */
  setSessionCookie(cookie: string) {
    this.useSessionCookie = true
    this.sessionCookie = cookie
    logger.info('Session cookie updated')
  }

  /**
   * Clear Reddit cache
   */
  clearCache() {
    redditCache.clear()
    logger.info('Reddit cache cleared')
  }

  /**
   * Fetch posts from subreddits
   */
  async fetchPosts(options: {
    subreddits: string[]
    sort?: 'hot' | 'new' | 'top' | 'rising'
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
    limit?: number
    includeNsfw?: boolean
  }): Promise<RedditPost[]> {
    const { subreddits, sort = 'hot', time = 'day', limit = 25, includeNsfw = false } = options

    // Check cache first
    const cached = redditCache.get({ subreddits, sort, time, limit, includeNsfw })
    if (cached) {
      logger.info({ count: cached.length, subreddits, sort }, 'Using cached Reddit posts')
      return cached
    }

    logger.info({ subreddits, sort, time, limit, includeNsfw }, 'Fetching posts from Reddit API')

    let posts: RedditPost[]
    if (this.snoowrap) {
      posts = await this.fetchPostsWithSnoowrap(subreddits, sort, time, limit, includeNsfw)
    } else if (this.useSessionCookie && this.sessionCookie) {
      posts = await this.fetchPostsWithSession(subreddits, sort, time, limit, includeNsfw)
    } else {
      throw new Error('Reddit client not configured. Please provide OAuth credentials or enable session cookie mode.')
    }

    // Cache the results
    redditCache.set({ subreddits, sort, time, limit, includeNsfw }, posts)
    
    return posts
  }

  /**
   * Fetch posts using Snoowrap (OAuth)
   */
  private async fetchPostsWithSnoowrap(
    subreddits: string[],
    sort: string,
    time: string,
    limit: number,
    includeNsfw: boolean
  ): Promise<RedditPost[]> {
    if (!this.snoowrap) throw new Error('Snoowrap not initialized')

    const allPosts: RedditPost[] = []

    for (const subreddit of subreddits) {
      try {
        let listing: any
        const sub = this.snoowrap.getSubreddit(subreddit)

        switch (sort) {
          case 'hot':
            listing = await sub.getHot({ limit })
            break
          case 'new':
            listing = await sub.getNew({ limit })
            break
          case 'top':
            listing = await sub.getTop({ time: time as any, limit })
            break
          case 'rising':
            listing = await sub.getRising({ limit })
            break
          default:
            listing = await sub.getHot({ limit })
        }

        const posts = listing.filter((post: any) => {
          // Filter video posts - accept posts with is_video flag OR direct mp4/video URLs
          const hasVideoFlag = post.is_video
          const hasVideoUrl = post.url && (
            post.url.toLowerCase().includes('.mp4') ||
            post.url.toLowerCase().includes('v.redd.it') ||
            post.url.toLowerCase().includes('reddit.com/video/') ||
            post.url.toLowerCase().includes('.gifv')
          )
          
          if (!hasVideoFlag && !hasVideoUrl) return false
          
          // Filter NSFW if not included
          if (!includeNsfw && post.over_18) return false
          return true
        })

        allPosts.push(...posts.map((post: any) => this.mapSnoowrapPost(post)))
      } catch (error) {
        logger.error({ error, subreddit }, 'Failed to fetch posts from subreddit')
      }
    }

    return allPosts
  }

  /**
   * Fetch posts using session cookie (fallback)
   */
  private async fetchPostsWithSession(
    subreddits: string[],
    sort: string,
    time: string,
    limit: number,
    includeNsfw: boolean
  ): Promise<RedditPost[]> {
    const allPosts: RedditPost[] = []

    for (const subreddit of subreddits) {
      try {
        let url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`
        if (sort === 'top') {
          url += `&t=${time}`
        }

        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'PinReddit/1.0.0',
            'Cookie': this.sessionCookie,
          },
        })

        const posts = response.data.data.children
          .map((child: any) => child.data)
          .filter((post: any) => {
            // Filter video posts - accept posts with is_video flag OR direct mp4/video URLs
            const hasVideoFlag = post.is_video
            const hasVideoUrl = post.url && (
              post.url.toLowerCase().includes('.mp4') ||
              post.url.toLowerCase().includes('v.redd.it') ||
              post.url.toLowerCase().includes('reddit.com/video/') ||
              post.url.toLowerCase().includes('.gifv')
            )
            
            if (!hasVideoFlag && !hasVideoUrl) return false
            
            if (!includeNsfw && post.over_18) return false
            return true
          })

        allPosts.push(...posts.map((post: any) => this.mapJsonPost(post)))
      } catch (error) {
        logger.error({ error, subreddit }, 'Failed to fetch posts from subreddit with session')
      }
    }

    return allPosts
  }

  /**
   * Get video information from a Reddit post
   */
  getVideoInfo(post: RedditPost): RedditVideoInfo | null {
    // Check if post has reddit_video media
    if (post.is_video && post.media?.reddit_video) {
      const redditVideo = post.media.reddit_video
      
      // Extract video URL
      let videoUrl = redditVideo.fallback_url
      
      // Remove audio track parameter if present
      videoUrl = videoUrl.replace(/\?source=fallback$/, '')
      
      // Construct audio URL (Reddit often stores audio separately)
      const audioUrl = videoUrl.replace(/DASH_\d+\.mp4/, 'DASH_audio.mp4')

      return {
        videoUrl,
        audioUrl,
        width: redditVideo.width,
        height: redditVideo.height,
        duration: redditVideo.duration,
        isGif: redditVideo.is_gif,
      }
    }
    
    // Check if post has a direct video URL (mp4, gifv, etc.)
    if (post.url) {
      const urlLower = post.url.toLowerCase()
      if (urlLower.includes('.mp4') || 
          urlLower.includes('v.redd.it') || 
          urlLower.includes('reddit.com/video/') ||
          urlLower.includes('.gifv')) {
        
        // For direct mp4 links, return basic info
        return {
          videoUrl: post.url,
          audioUrl: '', // Direct links usually have audio embedded
          width: 1280,
          height: 720,
          duration: 0, // Unknown duration
          isGif: urlLower.includes('.gifv') || urlLower.includes('gif'),
        }
      }
    }
    
    return null
  }

  /**
   * Fetch a single post by ID
   */
  async fetchPost(postId: string): Promise<RedditPost | null> {
    try {
      if (this.snoowrap) {
        const submission = await this.snoowrap.getSubmission(postId).fetch()
        return this.mapSnoowrapPost(submission)
      } else if (this.useSessionCookie && this.sessionCookie) {
        const response = await axios.get(`https://www.reddit.com/comments/${postId}.json`, {
          headers: {
            'User-Agent': 'PinReddit/1.0.0',
            'Cookie': this.sessionCookie,
          },
        })
        
        const post = response.data[0].data.children[0].data
        return this.mapJsonPost(post)
      }
      
      return null
    } catch (error) {
      logger.error({ error, postId }, 'Failed to fetch post')
      return null
    }
  }

  /**
   * Map Snoowrap post to RedditPost type
   */
  private mapSnoowrapPost(post: any): RedditPost {
    return {
      id: post.id,
      title: post.title,
      author: post.author.name,
      subreddit: post.subreddit.display_name,
      permalink: post.permalink,
      url: post.url,
      score: post.score,
      over_18: post.over_18,
      created_utc: post.created_utc,
      is_video: post.is_video,
      media: post.media,
    }
  }

  /**
   * Map JSON API post to RedditPost type
   */
  private mapJsonPost(post: any): RedditPost {
    return {
      id: post.id,
      title: post.title,
      author: post.author,
      subreddit: post.subreddit,
      permalink: post.permalink,
      url: post.url,
      score: post.score,
      over_18: post.over_18,
      created_utc: post.created_utc,
      is_video: post.is_video,
      media: post.media,
    }
  }
}

// Singleton instance
export const redditClient = new RedditClient()
