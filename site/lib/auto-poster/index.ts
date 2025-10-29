import axios from 'axios'
import { createLogger } from '@/lib/logger'
import { config } from '@/lib/config'
import type { RedditPostData, RedditCampaign } from './session-manager'

const logger = createLogger('auto-poster')

export interface PostingConfig {
  targetUrl: string
  username?: string
  password?: string
  apiKey?: string
  contentType: 'wordpress' | 'custom' | 'api'
  customEndpoint?: string
  enabled: boolean
}

export interface PostTemplate {
  title: string
  content: string
  excerpt?: string
  tags?: string[]
  categories?: string[]
  featuredImage?: string
  status: 'draft' | 'publish' | 'private'
}

export interface PostedContent {
  id: string
  redditPostId: string
  campaignId: string
  title: string
  url: string
  status: 'success' | 'failed' | 'pending'
  error?: string
  postedAt: Date
  targetSite: string
}

export class AutoPoster {
  private postingConfig: PostingConfig
  private postedContent: PostedContent[] = []

  constructor() {
    this.postingConfig = {
      targetUrl: '',
      contentType: 'wordpress',
      enabled: false,
    }
  }

  /**
   * Configure the posting system
   */
  configure(config: Partial<PostingConfig>): void {
    this.postingConfig = { ...this.postingConfig, ...config }
    logger.info('Auto-poster configuration updated')
  }

  /**
   * Test connection to target site
   */
  async testConnection(): Promise<boolean> {
    if (!this.postingConfig.targetUrl) {
      logger.warn('No target URL configured')
      return false
    }

    try {
      const response = await axios.get(this.postingConfig.targetUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'PinReddit/1.0.0',
        },
      })

      logger.info({ status: response.status }, 'Target site connection test successful')
      return response.status === 200
    } catch (error) {
      logger.error({ error }, 'Target site connection test failed')
      return false
    }
  }

  /**
   * Post Reddit content to target site
   */
  async postRedditContent(
    redditPost: RedditPostData,
    campaign: RedditCampaign,
    template?: Partial<PostTemplate>
  ): Promise<PostedContent> {
    const postedContent: PostedContent = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      redditPostId: redditPost.id,
      campaignId: campaign.id,
      title: redditPost.title,
      url: '',
      status: 'pending',
      postedAt: new Date(),
      targetSite: this.postingConfig.targetUrl,
    }

    try {
      // Generate post template
      const postTemplate = this.generatePostTemplate(redditPost, campaign, template)

      // Post based on content type
      let result
      switch (this.postingConfig.contentType) {
        case 'wordpress':
          result = await this.postToWordPress(postTemplate)
          break
        case 'custom':
          result = await this.postToCustomEndpoint(postTemplate)
          break
        case 'api':
          result = await this.postToAPI(postTemplate)
          break
        default:
          throw new Error(`Unsupported content type: ${this.postingConfig.contentType}`)
      }

      postedContent.url = result.url
      postedContent.status = 'success'
      
      logger.info({ 
        redditPostId: redditPost.id, 
        campaignId: campaign.id,
        postedUrl: result.url 
      }, 'Content posted successfully')

    } catch (error) {
      postedContent.status = 'failed'
      postedContent.error = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error({ 
        error, 
        redditPostId: redditPost.id, 
        campaignId: campaign.id 
      }, 'Failed to post content')
    }

    this.postedContent.push(postedContent)
    return postedContent
  }

  /**
   * Generate post template from Reddit content
   */
  private generatePostTemplate(
    redditPost: RedditPostData,
    campaign: RedditCampaign,
    customTemplate?: Partial<PostTemplate>
  ): PostTemplate {
    const baseTemplate: PostTemplate = {
      title: redditPost.title,
      content: this.generateContent(redditPost),
      excerpt: this.generateExcerpt(redditPost),
      tags: this.generateTags(redditPost, campaign),
      categories: [redditPost.subreddit],
      status: 'draft',
    }

    return { ...baseTemplate, ...customTemplate }
  }

  /**
   * Generate post content
   */
  private generateContent(redditPost: RedditPostData): string {
    let content = `<h2>${redditPost.title}</h2>\n\n`

    // Add Reddit post content if available
    if (redditPost.selftext) {
      content += `<p>${redditPost.selftext}</p>\n\n`
    }

    // Add video if available
    if (redditPost.is_video && redditPost.media?.reddit_video) {
      const videoUrl = redditPost.media.reddit_video.fallback_url
      content += `<video controls width="100%">\n`
      content += `  <source src="${videoUrl}" type="video/mp4">\n`
      content += `  Your browser does not support the video tag.\n`
      content += `</video>\n\n`
    }

    // Add image if available
    if (redditPost.preview?.images?.[0]?.source?.url) {
      const imageUrl = redditPost.preview.images[0].source.url
      content += `<img src="${imageUrl}" alt="${redditPost.title}" style="max-width: 100%; height: auto;">\n\n`
    }

    // Add attribution
    content += `<hr>\n\n`
    content += `<p><strong>Source:</strong> <a href="https://reddit.com${redditPost.permalink}" target="_blank">`
    content += `r/${redditPost.subreddit} - ${redditPost.author}</a></p>\n`
    content += `<p><strong>Score:</strong> ${redditPost.score} upvotes</p>\n`

    return content
  }

  /**
   * Generate post excerpt
   */
  private generateExcerpt(redditPost: RedditPostData): string {
    if (redditPost.selftext) {
      return redditPost.selftext.substring(0, 200) + '...'
    }
    return redditPost.title
  }

  /**
   * Generate tags
   */
  private generateTags(redditPost: RedditPostData, campaign: RedditCampaign): string[] {
    const tags = [
      'reddit',
      redditPost.subreddit,
      `score-${redditPost.score}`,
    ]

    if (redditPost.over_18) {
      tags.push('nsfw')
    }

    if (redditPost.is_video) {
      tags.push('video')
    }

    // Add campaign keywords as tags
    tags.push(...campaign.keywords)

    return tags
  }

  /**
   * Post to WordPress site
   */
  private async postToWordPress(template: PostTemplate): Promise<{ url: string }> {
    if (!this.postingConfig.username || !this.postingConfig.password) {
      throw new Error('WordPress credentials not configured')
    }

    const wpUrl = `${this.postingConfig.targetUrl}/wp-json/wp/v2/posts`
    
    const postData = {
      title: template.title,
      content: template.content,
      excerpt: template.excerpt,
      status: template.status,
      tags: template.tags,
      categories: template.categories,
    }

    const response = await axios.post(wpUrl, postData, {
      auth: {
        username: this.postingConfig.username,
        password: this.postingConfig.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return {
      url: response.data.link || `${this.postingConfig.targetUrl}/?p=${response.data.id}`,
    }
  }

  /**
   * Post to custom endpoint
   */
  private async postToCustomEndpoint(template: PostTemplate): Promise<{ url: string }> {
    if (!this.postingConfig.customEndpoint) {
      throw new Error('Custom endpoint not configured')
    }

    const response = await axios.post(this.postingConfig.customEndpoint, template, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.postingConfig.apiKey ? `Bearer ${this.postingConfig.apiKey}` : undefined,
      },
    })

    return {
      url: response.data.url || response.data.link || 'Posted successfully',
    }
  }

  /**
   * Post to API
   */
  private async postToAPI(template: PostTemplate): Promise<{ url: string }> {
    if (!this.postingConfig.apiKey) {
      throw new Error('API key not configured')
    }

    const response = await axios.post(this.postingConfig.targetUrl, template, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.postingConfig.apiKey}`,
      },
    })

    return {
      url: response.data.url || response.data.link || 'Posted successfully',
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PostingConfig {
    return { ...this.postingConfig }
  }

  /**
   * Get posting history
   */
  getPostedContent(): PostedContent[] {
    return [...this.postedContent]
  }

  /**
   * Get posting statistics
   */
  getPostingStats(): {
    total: number
    successful: number
    failed: number
    pending: number
  } {
    const total = this.postedContent.length
    const successful = this.postedContent.filter(p => p.status === 'success').length
    const failed = this.postedContent.filter(p => p.status === 'failed').length
    const pending = this.postedContent.filter(p => p.status === 'pending').length

    return { total, successful, failed, pending }
  }

  /**
   * Clear posting history
   */
  clearHistory(): void {
    this.postedContent = []
    logger.info('Posting history cleared')
  }
}

// Singleton instance
export const autoPoster = new AutoPoster()
