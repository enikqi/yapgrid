import axios from 'axios'
import { createLogger } from '@/lib/logger'
import { config } from '@/lib/config'
import { prisma } from '@/lib/db/prisma'

const logger = createLogger('reddit-session')

export interface RedditSessionConfig {
  sessionCookie: string
  userAgent?: string
  enabled: boolean
}

export interface RedditCampaign {
  id: string
  name: string
  subreddits: string[]
  keywords: string[]
  excludeKeywords: string[]
  minScore: number
  maxScore?: number
  sortBy: 'hot' | 'new' | 'top' | 'rising'
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
  includeNsfw: boolean
  postLimit: number
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
}

export interface RedditPostData {
  id: string
  title: string
  author: string
  subreddit: string
  permalink: string
  url: string
  score: number
  over_18: boolean
  created_utc: number
  is_video: boolean
  media?: any
  selftext?: string
  thumbnail?: string
  preview?: any
}

export class RedditSessionManager {
  private sessionConfig: RedditSessionConfig
  private campaigns: RedditCampaign[] = []

  constructor() {
    this.sessionConfig = {
      sessionCookie: config.REDDIT_SESSION_COOKIE || '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      enabled: Boolean(config.REDDIT_SESSION_COOKIE),
    }
  }

  /**
   * Load session configuration from database
   */
  async loadSessionConfig() {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: 'reddit_session_config' },
      })

      if (setting) {
        const loadedConfig = JSON.parse(setting.value)
        this.sessionConfig = loadedConfig
        logger.info({ 
          enabled: loadedConfig.enabled, 
          hasCookie: Boolean(loadedConfig.sessionCookie) 
        }, 'Reddit session configuration loaded from database')
      } else {
        logger.info('No session configuration found in database')
      }
    } catch (error) {
      logger.error('Failed to load session configuration from database', error)
    }
  }

  /**
   * Test Reddit session cookie validity
   */
  async testSession(): Promise<boolean> {
    if (!this.sessionConfig.sessionCookie) {
      logger.warn('No Reddit session cookie configured')
      return false
    }

    try {
      // Test by fetching posts from a subreddit instead of /api/me.json
      // This is more reliable as it tests actual functionality
      const response = await axios.get('https://www.reddit.com/r/Funnymemes/new.json?limit=1', {
        headers: {
          'User-Agent': this.sessionConfig.userAgent,
          'Cookie': this.sessionConfig.sessionCookie,
        },
        timeout: 10000,
      })

      if (response.data && response.data.data && response.data.data.children && response.data.data.children.length > 0) {
        logger.info('Reddit session valid - can fetch posts')
        return true
      }
      
      return false
    } catch (error) {
      logger.error({ error }, 'Reddit session test failed')
      return false
    }
  }

  /**
   * Ensure session config is loaded from database
   */
  private async ensureSessionConfigLoaded() {
    // Always try to load from database to get the latest config
    await this.loadSessionConfig()
  }

  /**
   * Fetch posts from Reddit using session cookie
   */
  async fetchRedditPosts(campaign: RedditCampaign): Promise<RedditPostData[]> {
    await this.ensureSessionConfigLoaded()
    
    logger.info({ 
      campaign: campaign.name, 
      sessionEnabled: this.sessionConfig.enabled,
      hasCookie: Boolean(this.sessionConfig.sessionCookie),
      subreddits: campaign.subreddits 
    }, 'Starting to fetch Reddit posts')
    
    if (!this.sessionConfig.enabled) {
      throw new Error('Reddit session not enabled')
    }

    const allPosts: RedditPostData[] = []

    for (const subreddit of campaign.subreddits) {
      try {
        const posts = await this.fetchSubredditPosts(subreddit, campaign)
        allPosts.push(...posts)
        logger.info({ subreddit, postsCount: posts.length }, 'Fetched posts from subreddit')
      } catch (error) {
        logger.error({ error, subreddit }, 'Failed to fetch posts from subreddit')
      }
    }

    // Filter posts based on campaign criteria
    const filteredPosts = this.filterPosts(allPosts, campaign)
    
    logger.info({ 
      campaign: campaign.name, 
      total: allPosts.length, 
      filtered: filteredPosts.length 
    }, 'Posts fetched and filtered')

    return filteredPosts
  }

  /**
   * Fetch posts from a specific subreddit
   */
  private async fetchSubredditPosts(
    subreddit: string, 
    campaign: RedditCampaign
  ): Promise<RedditPostData[]> {
    let url = `https://www.reddit.com/r/${subreddit}/${campaign.sortBy}.json?limit=${campaign.postLimit}`
    
    if (campaign.sortBy === 'top') {
      url += `&t=${campaign.timeRange}`
    }

    // Ensure cookie format is correct
    let cookieValue = this.sessionConfig.sessionCookie
    if (cookieValue && !cookieValue.startsWith('reddit_session=')) {
      cookieValue = `reddit_session=${cookieValue}`
    }
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': this.sessionConfig.userAgent,
        'Cookie': cookieValue,
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://www.reddit.com/r/${subreddit}/`,
      },
      timeout: 15000,
    })

    const posts = response.data.data.children.map((child: any) => child.data)
    
    return posts.map((post: any) => this.mapRedditPost(post))
  }

  /**
   * Filter posts based on campaign criteria
   */
  private filterPosts(posts: RedditPostData[], campaign: RedditCampaign): RedditPostData[] {
    return posts.filter(post => {
      // Check NSFW filter
      if (!campaign.includeNsfw && post.over_18) {
        return false
      }

      // Check score range
      if (post.score < campaign.minScore) {
        return false
      }
      if (campaign.maxScore && post.score > campaign.maxScore) {
        return false
      }

      // Check keywords (include)
      if (campaign.keywords.length > 0) {
        const titleLower = post.title.toLowerCase()
        const hasKeyword = campaign.keywords.some(keyword => 
          titleLower.includes(keyword.toLowerCase())
        )
        if (!hasKeyword) {
          return false
        }
      }

      // Check exclude keywords
      if (campaign.excludeKeywords.length > 0) {
        const titleLower = post.title.toLowerCase()
        const hasExcludeKeyword = campaign.excludeKeywords.some(keyword => 
          titleLower.includes(keyword.toLowerCase())
        )
        if (hasExcludeKeyword) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Map Reddit API post to our format
   */
  private mapRedditPost(post: any): RedditPostData {
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
      selftext: post.selftext,
      thumbnail: post.thumbnail,
      preview: post.preview,
    }
  }

  /**
   * Create a new campaign
   */
  createCampaign(campaignData: Omit<RedditCampaign, 'id'>): RedditCampaign {
    const campaign: RedditCampaign = {
      ...campaignData,
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    
    this.campaigns.push(campaign)
    logger.info({ campaignId: campaign.id }, 'Campaign created')
    
    return campaign
  }

  /**
   * Update an existing campaign
   */
  updateCampaign(campaignId: string, updates: Partial<RedditCampaign>): boolean {
    const index = this.campaigns.findIndex(c => c.id === campaignId)
    if (index === -1) {
      return false
    }

    this.campaigns[index] = { ...this.campaigns[index], ...updates }
    logger.info({ campaignId }, 'Campaign updated')
    
    return true
  }

  /**
   * Delete a campaign
   */
  deleteCampaign(campaignId: string): boolean {
    const index = this.campaigns.findIndex(c => c.id === campaignId)
    if (index === -1) {
      return false
    }

    this.campaigns.splice(index, 1)
    logger.info({ campaignId }, 'Campaign deleted')
    
    return true
  }

  /**
   * Get all campaigns
   */
  getCampaigns(): RedditCampaign[] {
    return [...this.campaigns]
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): RedditCampaign | null {
    return this.campaigns.find(c => c.id === campaignId) || null
  }

  /**
   * Get enabled campaigns
   */
  getEnabledCampaigns(): RedditCampaign[] {
    return this.campaigns.filter(c => c.enabled)
  }

  /**
   * Set session cookie
   */
  setSessionCookie(sessionCookie: string): void {
    this.sessionConfig.sessionCookie = sessionCookie
    this.sessionConfig.enabled = Boolean(sessionCookie)
    logger.info('Reddit session cookie updated')
  }

  /**
   * Update session configuration
   */
  async updateSessionConfig(config: Partial<RedditSessionConfig>): Promise<void> {
    try {
      this.sessionConfig = { ...this.sessionConfig, ...config }
      
      // Save to database
      await prisma.setting.upsert({
        where: { key: 'reddit_session_config' },
        update: { value: JSON.stringify(this.sessionConfig) },
        create: { key: 'reddit_session_config', value: JSON.stringify(this.sessionConfig) },
      })

      logger.info('Reddit session configuration updated and saved to database')
    } catch (error) {
      logger.error('Failed to update session configuration', error)
      throw error
    }
  }

  /**
   * Get session configuration
   */
  async getSessionConfig(): Promise<RedditSessionConfig> {
    await this.loadSessionConfig()
    return { ...this.sessionConfig }
  }
}

// Singleton instance
export const redditSessionManager = new RedditSessionManager()

// Initialize session config from database
redditSessionManager.loadSessionConfig().catch(error => {
  logger.error('Failed to initialize session config', error)
})
