import { promises as fs } from 'fs'
import path from 'path'
import { config } from '@/lib/config'
import { createLogger } from '@/lib/logger'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { StorageType } from '@/lib/types'

const logger = createLogger('storage')

// Initialize S3 client if configured
const s3Client = config.STORAGE_DRIVER === 's3' && config.S3_ENDPOINT
  ? new S3Client({
      endpoint: config.S3_ENDPOINT,
      region: config.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID || '',
        secretAccessKey: config.S3_SECRET_ACCESS_KEY || '',
      },
    })
  : null

export interface StorageFile {
  key: string
  size: number
  lastModified: Date
  url?: string
}

export interface StorageInterface {
  save(key: string, buffer: Buffer, mimeType?: string): Promise<string>
  get(key: string): Promise<Buffer>
  getUrl(key: string): Promise<string>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}

class LocalStorage implements StorageInterface {
  private basePath: string

  constructor() {
    this.basePath = path.resolve(config.MEDIA_DIR)
    this.ensureDirectory()
  }

  private async ensureDirectory() {
    try {
      await fs.mkdir(this.basePath, { recursive: true })
    } catch (error) {
      logger.error({ error }, 'Failed to create media directory')
    }
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key)
  }

  async save(key: string, buffer: Buffer): Promise<string> {
    const fullPath = this.getFullPath(key)
    const dir = path.dirname(fullPath)
    
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(fullPath, buffer)
    
    logger.debug({ key, size: buffer.length }, 'File saved locally')
    return key
  }

  async get(key: string): Promise<Buffer> {
    const fullPath = this.getFullPath(key)
    return fs.readFile(fullPath)
  }

  async getUrl(key: string): Promise<string> {
    // For local storage, return a relative URL
    return `/media/${key}`
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFullPath(key)
    try {
      await fs.unlink(fullPath)
      logger.debug({ key }, 'File deleted locally')
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.getFullPath(key)
    try {
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }
}

class S3Storage implements StorageInterface {
  private bucket: string

  constructor() {
    if (!config.S3_BUCKET) {
      throw new Error('S3_BUCKET is not configured')
    }
    this.bucket = config.S3_BUCKET
  }

  async save(key: string, buffer: Buffer, mimeType?: string): Promise<string> {
    if (!s3Client) {
      throw new Error('S3 client not initialized')
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType || 'application/octet-stream',
    })

    await s3Client.send(command)
    logger.debug({ key, size: buffer.length }, 'File saved to S3')
    return key
  }

  async get(key: string): Promise<Buffer> {
    if (!s3Client) {
      throw new Error('S3 client not initialized')
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    const response = await s3Client.send(command)
    const stream = response.Body as any
    const chunks: Uint8Array[] = []

    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }

  async getUrl(key: string): Promise<string> {
    if (!s3Client) {
      throw new Error('S3 client not initialized')
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    // Generate a presigned URL valid for 1 hour
    return getSignedUrl(s3Client, command, { expiresIn: 3600 })
  }

  async delete(key: string): Promise<void> {
    if (!s3Client) {
      throw new Error('S3 client not initialized')
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await s3Client.send(command)
    logger.debug({ key }, 'File deleted from S3')
  }

  async exists(key: string): Promise<boolean> {
    if (!s3Client) {
      throw new Error('S3 client not initialized')
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
      await s3Client.send(command)
      return true
    } catch (error) {
      if ((error as any).name === 'NoSuchKey') {
        return false
      }
      throw error
    }
  }
}

// Factory function to get the appropriate storage instance
export function getStorage(): StorageInterface {
  switch (config.STORAGE_DRIVER) {
    case 's3':
      return new S3Storage()
    case 'local':
    default:
      return new LocalStorage()
  }
}

// Helper functions
export async function saveFile(
  key: string,
  buffer: Buffer,
  mimeType?: string
): Promise<{ key: string; storage: StorageType }> {
  const storage = getStorage()
  await storage.save(key, buffer, mimeType)
  
  return {
    key,
    storage: config.STORAGE_DRIVER === 's3' ? 'S3' : 'LOCAL',
  }
}

export async function getFileUrl(key: string): Promise<string> {
  const storage = getStorage()
  return storage.getUrl(key)
}

export async function deleteFile(key: string): Promise<void> {
  const storage = getStorage()
  await storage.delete(key)
}

// Ensure media directory exists for local storage
if (config.STORAGE_DRIVER === 'local') {
  const mediaDir = path.resolve(config.MEDIA_DIR)
  fs.mkdir(mediaDir, { recursive: true }).catch((error) => {
    logger.error({ error }, 'Failed to create media directory')
  })
}
