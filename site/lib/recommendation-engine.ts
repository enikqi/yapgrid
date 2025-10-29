// Recommendation algorithm implementation
import type { Post, Asset } from '@/lib/types'
import type { UserProfile } from './event-tracker'

export interface RecommendationConfig {
  w_popularity: number
  w_recency: number
  w_affinity: number
  lambda: number
  fresh_boost: number
  diversity: number
}

export interface ScoredPost extends Post {
  assets: Asset[]
  score: number
  popularityScore: number
  recencyScore: number
  affinityScore: number
  diversityPenalty: number
  freshBoost: number
}

export class RecommendationEngine {
  private config: RecommendationConfig = {
    w_popularity: 1.0,
    w_recency: 0.7,
    w_affinity: 1.3,
    lambda: 0.06,
    fresh_boost: 0.2,
    diversity: 0.3
  }

  constructor(config?: Partial<RecommendationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  // Main recommendation function
  async recommendPosts(
    posts: (Post & { assets: Asset[] })[],
    userProfile: UserProfile,
    algorithm: 'personal' | 'latest' | 'trending' = 'personal'
  ): Promise<ScoredPost[]> {
    if (algorithm === 'latest') {
      return this.sortByLatest(posts)
    }
    
    if (algorithm === 'trending') {
      return this.sortByTrending(posts)
    }

    // Personal algorithm
    const scoredPosts = await this.scorePosts(posts, userProfile)
    const diversifiedPosts = this.applyDiversity(scoredPosts, userProfile)
    
    return diversifiedPosts.sort((a, b) => b.score - a.score)
  }

  // Score individual posts
  private async scorePosts(
    posts: (Post & { assets: Asset[] })[],
    userProfile: UserProfile
  ): Promise<ScoredPost[]> {
    return posts.map(post => {
      const popularityScore = this.calculatePopularity(post)
      const recencyScore = this.calculateRecency(post)
      const affinityScore = this.calculateAffinity(post, userProfile)
      const freshBoost = this.calculateFreshBoost(post)
      
      const totalScore = 
        this.config.w_popularity * popularityScore +
        this.config.w_recency * recencyScore +
        this.config.w_affinity * affinityScore +
        freshBoost

      return {
        ...post,
        score: totalScore,
        popularityScore,
        recencyScore,
        affinityScore,
        diversityPenalty: 0,
        freshBoost
      }
    })
  }

  // Calculate popularity score: log(1+upvotes) + 0.5*log(1+comments)
  private calculatePopularity(post: Post): number {
    const upvotes = post.score || 0
    const comments = 0 // We don't have comment count in our schema yet
    
    return Math.log(1 + upvotes) + 0.5 * Math.log(1 + comments)
  }

  // Calculate recency score: e^(-λ*age_hours)
  private calculateRecency(post: Post): number {
    const publishedAt = post.publishedAt || post.createdUtc
    const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60)
    
    return Math.exp(-this.config.lambda * ageHours)
  }

  // Calculate affinity score based on user preferences
  private calculateAffinity(post: Post, userProfile: UserProfile): number {
    let affinity = 0

    // Subreddit affinity
    if (post.subreddit && userProfile.subredditWeights[post.subreddit]) {
      affinity += userProfile.subredditWeights[post.subreddit]
    }

    // Author affinity
    if (post.author && userProfile.authorWeights[post.author]) {
      affinity += userProfile.authorWeights[post.author]
    }

    // Keyword affinity (simplified - would need NLP in production)
    const keywords = this.extractKeywords(post.title)
    keywords.forEach(keyword => {
      if (userProfile.keywordWeights[keyword]) {
        affinity += userProfile.keywordWeights[keyword]
      }
    })

    return affinity
  }

  // Calculate fresh boost for posts < 3 hours old
  private calculateFreshBoost(post: Post): number {
    const publishedAt = post.publishedAt || post.createdUtc
    const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60)
    
    return ageHours < 3 ? this.config.fresh_boost : 0
  }

  // Apply diversity penalty to prevent too many similar posts
  private applyDiversity(posts: ScoredPost[], userProfile: UserProfile): ScoredPost[] {
    const diversifiedPosts: ScoredPost[] = []
    const seenSubreddits = new Set<string>()
    const seenAuthors = new Set<string>()

    posts.forEach(post => {
      let diversityPenalty = 0

      // Penalize repeated subreddits
      if (seenSubreddits.has(post.subreddit)) {
        diversityPenalty += this.config.diversity * 0.5
      }

      // Penalize repeated authors
      if (seenAuthors.has(post.author)) {
        diversityPenalty += this.config.diversity * 0.3
      }

      // Apply penalty
      post.diversityPenalty = diversityPenalty
      post.score -= diversityPenalty

      diversifiedPosts.push(post)
      seenSubreddits.add(post.subreddit)
      seenAuthors.add(post.author)
    })

    return diversifiedPosts
  }

  // Extract keywords from post title (simplified)
  private extractKeywords(title: string): string[] {
    // Simple keyword extraction - in production, use NLP libraries
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    return words.slice(0, 5) // Take top 5 keywords
  }

  // Sort by latest (chronological)
  private sortByLatest(posts: (Post & { assets: Asset[] })[]): ScoredPost[] {
    return posts
      .sort((a, b) => {
        // Use createdUtc for Reddit posts, fallback to publishedAt
        const dateA = new Date(a.createdUtc || a.publishedAt || a.createdAt).getTime()
        const dateB = new Date(b.createdUtc || b.publishedAt || b.createdAt).getTime()
        return dateB - dateA // Descending order (newest first)
      })
      .map(post => ({
        ...post,
        score: 0,
        popularityScore: 0,
        recencyScore: 0,
        affinityScore: 0,
        diversityPenalty: 0,
        freshBoost: 0
      }))
  }

  // Sort by trending (popularity + recency)
  private sortByTrending(posts: (Post & { assets: Asset[] })[]): ScoredPost[] {
    return posts
      .map(post => {
        const popularityScore = this.calculatePopularity(post)
        const recencyScore = this.calculateRecency(post)
        const score = popularityScore + recencyScore

        return {
          ...post,
          score,
          popularityScore,
          recencyScore,
          affinityScore: 0,
          diversityPenalty: 0,
          freshBoost: 0
        }
      })
      .sort((a, b) => b.score - a.score)
  }

  // Cold start: mix trending + recent + explore
  async coldStartRecommendations(
    posts: (Post & { assets: Asset[] })[],
    userProfile: UserProfile
  ): Promise<ScoredPost[]> {
    const trending = this.sortByTrending(posts).slice(0, Math.floor(posts.length * 0.4))
    const recent = this.sortByLatest(posts).slice(0, Math.floor(posts.length * 0.4))
    const explore = this.getRandomPosts(posts, Math.floor(posts.length * 0.1))

    const mixed = [...trending, ...recent, ...explore]
    return this.shuffleArray(mixed)
  }

  // Get random posts for exploration
  private getRandomPosts(posts: (Post & { assets: Asset[] })[], count: number): ScoredPost[] {
    const shuffled = this.shuffleArray([...posts])
    return shuffled.slice(0, count).map(post => ({
      ...post,
      score: 0,
      popularityScore: 0,
      recencyScore: 0,
      affinityScore: 0,
      diversityPenalty: 0,
      freshBoost: 0
    }))
  }

  // Shuffle array utility
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Update configuration
  updateConfig(newConfig: Partial<RecommendationConfig>) {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine()
