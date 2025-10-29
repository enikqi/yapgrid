// Re-export Prisma types
export type {
  Post,
  Asset,
  Job,
  Board,
  Setting,
  User,
  PostStatus,
  AssetType,
  StorageType,
  JobType,
  JobStatus,
} from '@prisma/client'

// Reddit types
export interface RedditPost {
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
  media?: {
    reddit_video?: {
      fallback_url: string
      height: number
      width: number
      duration: number
      is_gif: boolean
    }
  }
}

export interface RedditVideoInfo {
  videoUrl: string
  audioUrl?: string
  width: number
  height: number
  duration: number
  isGif: boolean
}

// Pinterest types
export interface PinterestMediaResponse {
  media_id: string
  media_type: string
  upload_url: string
  upload_parameters: Record<string, string>
}

export interface PinterestPinRequest {
  board_id: string
  media_source: {
    source_type: 'media_upload'
    media_id: string
  }
  title?: string
  description?: string
  link?: string
  alt_text?: string
}

export interface PinterestPinResponse {
  id: string
  created_at: string
  link: string
  title: string
  description: string
  dominant_color: string
  alt_text: string
  board_id: string
  board_section_id: string | null
  board_owner: {
    username: string
  }
  media: {
    media_type: string
    images: Record<string, { width: number; height: number; url: string }>
  }
}

// Job payloads
export interface IngestJobPayload {
  subreddits: string[]
  keywords?: string[]
  minUpvotes?: number
  includeNsfw?: boolean
  limit?: number
}

export interface DownloadJobPayload {
  postId: string
  videoUrl: string
  audioUrl?: string
}

export interface PublishJobPayload {
  postId: string
  boardId: string
  title?: string
  description?: string
}

// API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Settings
export interface AppSettings {
  subreddits: string[]
  keywords: string[]
  minUpvotes: number
  includeNsfw: boolean
  maxDuration: number
  maxFilesize: number
  watermarkEnabled: boolean
  autoIngest: boolean
  autoPublish: boolean
  requireApproval: boolean
  titleTemplate: string
  descriptionTemplate: string
}
