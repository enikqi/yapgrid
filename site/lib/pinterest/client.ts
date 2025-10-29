import axios, { AxiosInstance } from 'axios'
import FormData from 'form-data'
import { createReadStream } from 'fs'
import { config } from '@/lib/config'
import { createLogger } from '@/lib/logger'
import { isValidAspectRatioForPinterest } from '@/lib/utils'
import type { 
  PinterestMediaResponse, 
  PinterestPinRequest, 
  PinterestPinResponse 
} from '@/lib/types'

const logger = createLogger('pinterest-client')

export class PinterestClient {
  private apiClient: AxiosInstance
  private accessToken: string

  constructor(accessToken?: string) {
    this.accessToken = accessToken || config.PINTEREST_ACCESS_TOKEN || ''
    
    if (!this.accessToken) {
      throw new Error('Pinterest access token not configured')
    }

    this.apiClient = axios.create({
      baseURL: 'https://api.pinterest.com/v5',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          logger.error({
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url,
          }, 'Pinterest API error')
        }
        throw error
      }
    )
  }

  /**
   * Step 1: Register media upload
   * This gets us the upload URL and media_id
   */
  async registerMedia(mimeType = 'video/mp4'): Promise<PinterestMediaResponse> {
    try {
      const response = await this.apiClient.post('/media', {
        media_type: mimeType,
      })

      logger.info({ mediaId: response.data.media_id }, 'Media registered successfully')
      
      return response.data
    } catch (error) {
      logger.error({ error }, 'Failed to register media')
      throw new Error('Failed to register media with Pinterest')
    }
  }

  /**
   * Step 2: Upload media file to the provided URL
   */
  async uploadMedia(uploadUrl: string, filePath: string): Promise<void> {
    try {
      // Create form data
      const form = new FormData()
      
      // Pinterest expects the file to be uploaded as 'file' field
      form.append('file', createReadStream(filePath))

      // Upload to the presigned URL
      await axios.post(uploadUrl, form, {
        headers: {
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      })

      logger.info({ uploadUrl }, 'Media uploaded successfully')
    } catch (error) {
      logger.error({ error, uploadUrl }, 'Failed to upload media')
      throw new Error('Failed to upload media to Pinterest')
    }
  }

  /**
   * Step 3: Create a pin with the uploaded media
   */
  async createPin(pinData: PinterestPinRequest): Promise<PinterestPinResponse> {
    try {
      // Validate required fields
      if (!pinData.board_id) {
        throw new Error('Board ID is required')
      }

      if (!pinData.media_source?.media_id) {
        throw new Error('Media ID is required')
      }

      // Pinterest has specific requirements for pin fields
      const requestData: any = {
        board_id: pinData.board_id,
        media_source: {
          source_type: 'media_upload',
          media_id: pinData.media_source.media_id,
        },
      }

      // Optional fields
      if (pinData.title) {
        requestData.title = pinData.title.substring(0, 100) // Max 100 chars
      }

      if (pinData.description) {
        requestData.description = pinData.description.substring(0, 500) // Max 500 chars
      }

      if (pinData.link) {
        requestData.link = pinData.link
      }

      if (pinData.alt_text) {
        requestData.alt_text = pinData.alt_text.substring(0, 500) // Max 500 chars
      }

      const response = await this.apiClient.post('/pins', requestData)

      logger.info({ 
        pinId: response.data.id, 
        boardId: pinData.board_id 
      }, 'Pin created successfully')

      return response.data
    } catch (error) {
      logger.error({ error, pinData }, 'Failed to create pin')
      throw new Error('Failed to create pin on Pinterest')
    }
  }

  /**
   * Get user's boards
   */
  async getBoards(pageSize = 25, bookmark?: string): Promise<{
    items: Array<{
      id: string
      name: string
      description: string | null
      privacy: string
    }>
    bookmark: string | null
  }> {
    try {
      const params: any = {
        page_size: pageSize,
      }

      if (bookmark) {
        params.bookmark = bookmark
      }

      const response = await this.apiClient.get('/boards', { params })

      return {
        items: response.data.items,
        bookmark: response.data.bookmark || null,
      }
    } catch (error) {
      logger.error({ error }, 'Failed to get boards')
      throw new Error('Failed to get Pinterest boards')
    }
  }

  /**
   * Get a specific board
   */
  async getBoard(boardId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/boards/${boardId}`)
      return response.data
    } catch (error) {
      logger.error({ error, boardId }, 'Failed to get board')
      throw new Error('Failed to get Pinterest board')
    }
  }

  /**
   * Validate video specifications for Pinterest
   */
  validateVideoSpecs(specs: {
    width: number
    height: number
    duration: number
    filesize: number
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check aspect ratio
    if (!isValidAspectRatioForPinterest(specs.width, specs.height)) {
      errors.push(`Invalid aspect ratio. Pinterest prefers 1:1, 2:3, or 9:16. Got ${specs.width}:${specs.height}`)
    }

    // Check duration (4 seconds to 15 minutes)
    if (specs.duration < 4) {
      errors.push('Video duration must be at least 4 seconds')
    }
    if (specs.duration > 900) {
      errors.push('Video duration must not exceed 15 minutes')
    }

    // Check file size (max ~2GB, but recommend under 1GB)
    const maxSize = 1024 * 1024 * 1024 // 1GB
    if (specs.filesize > maxSize) {
      errors.push(`Video file size (${(specs.filesize / 1024 / 1024).toFixed(2)}MB) exceeds recommended 1GB`)
    }

    // Check dimensions
    if (specs.width < 240 || specs.height < 240) {
      errors.push('Video dimensions must be at least 240x240 pixels')
    }
    if (specs.width > 1920 || specs.height > 1920) {
      errors.push('Video dimensions should not exceed 1920 pixels')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Complete flow: Register, Upload, and Create Pin
   */
  async publishVideo(options: {
    videoPath: string
    boardId: string
    title?: string
    description?: string
    link?: string
    videoSpecs?: {
      width: number
      height: number
      duration: number
      filesize: number
    }
  }): Promise<PinterestPinResponse> {
    const { videoPath, boardId, title, description, link, videoSpecs } = options

    // Validate video specs if provided
    if (videoSpecs) {
      const validation = this.validateVideoSpecs(videoSpecs)
      if (!validation.valid) {
        throw new Error(`Video validation failed: ${validation.errors.join(', ')}`)
      }
    }

    try {
      // Step 1: Register media
      logger.info({ videoPath, boardId }, 'Starting Pinterest publish flow')
      const mediaResponse = await this.registerMedia('video/mp4')

      // Step 2: Upload video
      logger.info({ mediaId: mediaResponse.media_id }, 'Uploading video to Pinterest')
      await this.uploadMedia(mediaResponse.upload_url, videoPath)

      // Step 3: Create pin
      logger.info({ mediaId: mediaResponse.media_id }, 'Creating pin')
      const pin = await this.createPin({
        board_id: boardId,
        media_source: {
          source_type: 'media_upload',
          media_id: mediaResponse.media_id,
        },
        title,
        description,
        link,
      })

      logger.info({ pinId: pin.id, boardId }, 'Video published successfully to Pinterest')
      return pin
    } catch (error) {
      logger.error({ error, videoPath, boardId }, 'Failed to publish video to Pinterest')
      throw error
    }
  }
}

// Factory function to create Pinterest client
export function createPinterestClient(accessToken?: string): PinterestClient {
  return new PinterestClient(accessToken)
}
