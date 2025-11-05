import axios, { AxiosInstance } from 'axios'
import FormData from 'form-data'
import { createReadStream } from 'fs'
import { createLogger } from '@/lib/logger'

const logger = createLogger('pinterest/session-client')

export interface PinterestSessionBoard {
  id: string
  name: string
  url: string
  pin_count: number
  follower_count: number
  privacy: string
}

export interface PinterestSessionPinData {
  title: string
  description: string
  board_id: string
  media_url?: string
  media_path?: string
  link?: string
  alt_text?: string
}

/**
 * Pinterest Client using Session Cookie Authentication
 * This bypasses the need for OAuth and uses your Pinterest session directly
 */
export class PinterestSessionClient {
  private client: AxiosInstance
  private sessionId: string
  private csrfToken: string = ''

  constructor(sessionId: string) {
    this.sessionId = sessionId
    
    this.client = axios.create({
      baseURL: 'https://www.pinterest.com',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'X-APP-VERSION': 'cb1c7f9',
        'X-Pinterest-AppState': 'active',
        'Cookie': `_auth=${this.sessionId}; _pinterest_sess=${this.sessionId}`,
        'Referer': 'https://www.pinterest.com/',
        'Origin': 'https://www.pinterest.com',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      },
      withCredentials: true
    })

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          logger.error({
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers,
            url: error.config?.url,
          }, 'Pinterest session API error')
        } else if (error.request) {
          logger.error({
            message: error.message,
            code: error.code
          }, 'Pinterest request failed')
        }
        throw error
      }
    )
  }

  /**
   * Initialize session and get CSRF token
   */
  async initialize(): Promise<boolean> {
    try {
      // Fetch homepage to get CSRF token and verify session
      const response = await this.client.get('/', {
        maxRedirects: 5,
        validateStatus: (status) => status < 400
      })

      // Extract CSRF token from cookies or page content
      const setCookies = response.headers['set-cookie'] || []
      for (const cookie of setCookies) {
        if (cookie.includes('csrftoken=')) {
          this.csrfToken = cookie.split('csrftoken=')[1].split(';')[0]
          break
        }
      }

      // If no CSRF in cookies, try to extract from HTML
      if (!this.csrfToken && response.data) {
        const csrfMatch = response.data.match(/"csrftoken":"([^"]+)"/)
        if (csrfMatch) {
          this.csrfToken = csrfMatch[1]
        }
      }

      if (this.csrfToken) {
        this.client.defaults.headers['X-CSRFToken'] = this.csrfToken
        logger.info('Pinterest session initialized successfully')
        return true
      } else {
        logger.warn('Could not extract CSRF token, continuing without it')
        return true
      }
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Pinterest session')
      return false
    }
  }

  /**
   * Fetch user's boards
   */
  async getBoards(): Promise<PinterestSessionBoard[]> {
    try {
      // Pinterest's internal API endpoint for fetching boards
      const response = await this.client.get('/resource/BoardsResource/get/', {
        params: {
          source_url: '/boards/',
          data: JSON.stringify({
            options: {
              filter: 'all',
              field_set_key: 'detailed',
              page_size: 25
            },
            context: {}
          })
        }
      })

      if (response.data && response.data.resource_response) {
        const boards = response.data.resource_response.data || []
        return boards.map((board: any) => ({
          id: board.id,
          name: board.name,
          url: board.url,
          pin_count: board.pin_count || 0,
          follower_count: board.follower_count || 0,
          privacy: board.privacy || 'public'
        }))
      }

      return []
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Pinterest boards')
      throw new Error('Failed to fetch boards from Pinterest')
    }
  }

  /**
   * Upload media and create a pin
   * This uses Pinterest's internal pin creation endpoint
   */
  async createPin(pinData: PinterestSessionPinData): Promise<any> {
    try {
      logger.info({ title: pinData.title, board_id: pinData.board_id }, 'Creating Pinterest pin via session')

      // Step 1: If we have a local file, upload it first
      let mediaUrl = pinData.media_url
      
      if (pinData.media_path && !mediaUrl) {
        mediaUrl = await this.uploadMedia(pinData.media_path)
      }

      if (!mediaUrl) {
        throw new Error('No media URL or path provided')
      }

      // Step 2: Create the pin using Pinterest's internal API
      const pinPayload = {
        options: {
          board_id: pinData.board_id,
          description: pinData.description || '',
          title: pinData.title || '',
          link: pinData.link || '',
          image_url: mediaUrl,
          method: 'uploaded'
        },
        context: {}
      }

      const response = await this.client.post('/resource/PinResource/create/', {
        source_url: '/pin-builder/',
        data: JSON.stringify(pinPayload)
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        }
      })

      if (response.data && response.data.resource_response) {
        const pinResponse = response.data.resource_response.data
        logger.info({ pinId: pinResponse.id }, 'Pinterest pin created successfully')
        return {
          id: pinResponse.id,
          url: `https://www.pinterest.com/pin/${pinResponse.id}/`,
          board_id: pinData.board_id
        }
      }

      throw new Error('Invalid response from Pinterest')
    } catch (error) {
      logger.error({ error, pinData }, 'Failed to create Pinterest pin')
      throw new Error('Failed to create pin on Pinterest')
    }
  }

  /**
   * Upload media to Pinterest
   */
  private async uploadMedia(filePath: string): Promise<string> {
    try {
      const form = new FormData()
      form.append('img', createReadStream(filePath))

      const response = await this.client.post('/upload-image/', form, {
        headers: {
          ...form.getHeaders(),
          'X-CSRFToken': this.csrfToken
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      })

      if (response.data && response.data.image_url) {
        logger.info({ imageUrl: response.data.image_url }, 'Media uploaded to Pinterest')
        return response.data.image_url
      }

      throw new Error('No image URL in upload response')
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to upload media to Pinterest')
      throw new Error('Failed to upload media')
    }
  }

  /**
   * Test if the session is valid
   */
  async testSession(): Promise<boolean> {
    try {
      const response = await this.client.get('/resource/UserResource/get/', {
        params: {
          source_url: '/',
          data: JSON.stringify({
            options: {
              field_set_key: 'detailed'
            },
            context: {}
          })
        }
      })

      if (response.data && response.data.resource_response) {
        const userData = response.data.resource_response.data
        logger.info({ 
          username: userData.username,
          fullName: userData.full_name 
        }, 'Pinterest session is valid')
        return true
      }

      return false
    } catch (error) {
      logger.error({ error }, 'Pinterest session test failed')
      return false
    }
  }
}

/**
 * Factory function to create Pinterest session client
 */
export function createPinterestSessionClient(sessionId: string): PinterestSessionClient {
  return new PinterestSessionClient(sessionId)
}

