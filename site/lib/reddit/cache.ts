import { createLogger } from '@/lib/logger'
import type { RedditPost } from '@/lib/types'

const logger = createLogger('reddit-cache')

// Simple in-memory cache for Reddit posts
// In production, this should use Redis
class RedditCache {
  private cache = new Map<string, { data: RedditPost[], timestamp: number }>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(params: {
    subreddits: string[]
    sort: string
    time: string
    limit: number
    includeNsfw: boolean
  }): string {
    return JSON.stringify(params)
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.TTL
  }

  get(params: {
    subreddits: string[]
    sort: string
    time: string
    limit: number
    includeNsfw: boolean
  }): RedditPost[] | null {
    const key = this.getCacheKey(params)
    const cached = this.cache.get(key)
    
    if (!cached) {
      logger.debug({ key }, 'Cache miss')
      return null
    }
    
    if (this.isExpired(cached.timestamp)) {
      logger.debug({ key }, 'Cache expired')
      this.cache.delete(key)
      return null
    }
    
    logger.debug({ key, count: cached.data.length }, 'Cache hit')
    return cached.data
  }

  set(params: {
    subreddits: string[]
    sort: string
    time: string
    limit: number
    includeNsfw: boolean
  }, data: RedditPost[]): void {
    const key = this.getCacheKey(params)
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    
    logger.debug({ key, count: data.length }, 'Cached Reddit posts')
  }

  clear(): void {
    this.cache.clear()
    logger.info('Cache cleared')
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, value] of this.cache.entries()) {
      if (this.isExpired(value.timestamp)) {
        this.cache.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      logger.debug({ cleaned }, 'Cleaned expired cache entries')
    }
  }
}

export const redditCache = new RedditCache()

// Cleanup expired entries every 10 minutes
setInterval(() => {
  redditCache.cleanup()
}, 10 * 60 * 1000)
