// Event tracking system for user interactions
export interface UserEvent {
  type: 'impression' | 'click' | 'dwell' | 'upvote' | 'save' | 'hide' | 'comment'
  postId: string
  timestamp: number
  metadata?: {
    dwellTime?: number // in milliseconds
    scrollPosition?: number
    subreddit?: string
    author?: string
  }
}

export interface UserProfile {
  subredditWeights: Record<string, number>
  keywordWeights: Record<string, number>
  authorWeights: Record<string, number>
  interactionHistory: UserEvent[]
  preferences: {
    personalizedFeed: boolean
    diversityLevel: number // 0-1
  }
}

class EventTracker {
  private events: UserEvent[] = []
  private profile: UserProfile | null = null
  private isSignedIn: boolean = false
  private userId: string | null = null

  constructor() {
    this.loadProfile()
    // Only setup event listeners on client side
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  // Load user profile from localStorage or API
  private async loadProfile() {
    try {
      // Only access localStorage on client side
      if (typeof window === 'undefined') {
        this.profile = this.createDefaultProfile()
        return
      }

      const stored = localStorage.getItem('userProfile')
      if (stored) {
        this.profile = JSON.parse(stored)
      } else {
        this.profile = this.createDefaultProfile()
        this.saveProfile()
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
      this.profile = this.createDefaultProfile()
    }
  }

  // Create default profile for new users
  private createDefaultProfile(): UserProfile {
    return {
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

  // Save profile to localStorage or API
  private async saveProfile() {
    try {
      if (this.isSignedIn && this.userId) {
        // Save to API for signed-in users
        await fetch('/api/reco/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: this.profile })
        })
      } else if (typeof window !== 'undefined') {
        // Save to localStorage for anonymous users (only on client side)
        localStorage.setItem('userProfile', JSON.stringify(this.profile))
      }
    } catch (error) {
      console.error('Failed to save user profile:', error)
    }
  }

  // Track user events
  trackEvent(event: Omit<UserEvent, 'timestamp'>) {
    // Only track events on client side
    if (typeof window === 'undefined' || !this.profile) {
      return
    }

    const fullEvent: UserEvent = {
      ...event,
      timestamp: Date.now()
    }

    this.events.push(fullEvent)
    this.profile.interactionHistory.push(fullEvent)

    // Update weights based on interaction
    this.updateWeights(fullEvent)

    // Save profile after each event
    this.saveProfile()

    // Send to analytics if needed
    this.sendToAnalytics(fullEvent)
  }

  // Update user preference weights based on interactions
  private updateWeights(event: UserEvent) {
    const { type, postId, metadata } = event
    const weight = this.getInteractionWeight(type)

    if (metadata?.subreddit) {
      this.profile!.subredditWeights[metadata.subreddit] = 
        (this.profile!.subredditWeights[metadata.subreddit] || 0) + weight
    }

    if (metadata?.author) {
      this.profile!.authorWeights[metadata.author] = 
        (this.profile!.authorWeights[metadata.author] || 0) + weight
    }

    // Extract keywords from post title/content
    // This would need the actual post data, so we'll implement this later
  }

  // Get weight multiplier based on interaction type
  private getInteractionWeight(type: UserEvent['type']): number {
    const weights = {
      'upvote': 2.0,
      'save': 1.5,
      'click': 1.0,
      'dwell': 0.5,
      'comment': 1.8,
      'hide': -1.0,
      'impression': 0.1
    }
    return weights[type] || 0
  }

  // Setup event listeners for automatic tracking
  private setupEventListeners() {
    // Track page visibility for dwell time
    let startTime = Date.now()
    let currentPostId: string | null = null

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && currentPostId) {
        const dwellTime = Date.now() - startTime
        this.trackEvent({
          type: 'dwell',
          postId: currentPostId,
          metadata: { dwellTime }
        })
      } else {
        startTime = Date.now()
      }
    })

    // Track scroll position
    let lastScrollTime = Date.now()
    window.addEventListener('scroll', () => {
      const now = Date.now()
      if (now - lastScrollTime > 1000) { // Throttle to 1 second
        this.trackEvent({
          type: 'impression',
          postId: 'scroll',
          metadata: { scrollPosition: window.scrollY }
        })
        lastScrollTime = now
      }
    })
  }

  // Send events to analytics (placeholder)
  private sendToAnalytics(event: UserEvent) {
    // This could send to Google Analytics, Mixpanel, etc.
    console.log('Analytics event:', event)
  }

  // Get current user profile
  getProfile(): UserProfile {
    if (!this.profile) {
      this.profile = this.createDefaultProfile()
    }
    return this.profile
  }

  // Update user preferences
  updatePreferences(preferences: Partial<UserProfile['preferences']>) {
    if (!this.profile) {
      this.profile = this.createDefaultProfile()
    }
    this.profile.preferences = { ...this.profile.preferences, ...preferences }
    this.saveProfile()
  }

  // Set user authentication status
  setAuthStatus(isSignedIn: boolean, userId?: string) {
    this.isSignedIn = isSignedIn
    this.userId = userId || null
    
    if (isSignedIn) {
      // Load profile from API
      this.loadProfileFromAPI()
    }
  }

  // Load profile from API for signed-in users
  private async loadProfileFromAPI() {
    try {
      const response = await fetch('/api/reco/profile')
      if (response.ok) {
        const data = await response.json()
        this.profile = data.profile
      }
    } catch (error) {
      console.error('Failed to load profile from API:', error)
    }
  }
}

// Export singleton instance - lazy loaded
let eventTrackerInstance: EventTracker | null = null

export function getEventTracker(): EventTracker {
  if (!eventTrackerInstance) {
    eventTrackerInstance = new EventTracker()
  }
  return eventTrackerInstance
}

// Export hook for React components
export function useEventTracker() {
  const tracker = getEventTracker()
  return {
    trackEvent: tracker.trackEvent.bind(tracker),
    getProfile: tracker.getProfile.bind(tracker),
    updatePreferences: tracker.updatePreferences.bind(tracker),
    setAuthStatus: tracker.setAuthStatus.bind(tracker)
  }
}
