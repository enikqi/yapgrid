import { z } from 'zod'

const envSchema = z.object({
  // Application
  APP_PORT: z.string().default('3002'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().min(1),
  
  // Redis
  REDIS_URL: z.string().optional(),
  
  // Reddit
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_REFRESH_TOKEN: z.string().optional(),
  REDDIT_SESSION_COOKIE: z.string().optional(),
  
  // Pinterest
  PINTEREST_ACCESS_TOKEN: z.string().optional(),
  PINTEREST_DEFAULT_BOARD_ID: z.string().optional(),
  
  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  MEDIA_DIR: z.string().default('./media'),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Video limits
  MAX_DURATION_SECONDS: z.string().transform(Number).default('900'),
  MAX_FILESIZE_MB: z.string().transform(Number).default('400'),
  
  // Scheduler
  CRON_INGEST: z.string().default('*/30 * * * *'),
  CRON_PUBLISH: z.string().default('*/15 * * * *'),
  QUEUE_CONCURRENCY: z.string().transform(Number).default('3'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().default('http://localhost:3002'),
  NEXTAUTH_SECRET: z.string().min(1),
  
  // Email (optional)
  EMAIL_SERVER: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid environment variables:')
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err) => {
          console.error(`  ${err.path.join('.')}: ${err.message}`)
        })
      }
      process.exit(1)
    }
    throw error
  }
}

export const config = validateEnv()

// Helper functions for specific configurations
export const isProduction = () => config.NODE_ENV === 'production'
export const isDevelopment = () => config.NODE_ENV === 'development'

export const redditConfig = {
  hasOAuth: () => Boolean(config.REDDIT_CLIENT_ID && config.REDDIT_CLIENT_SECRET),
  hasSessionCookie: () => Boolean(config.REDDIT_SESSION_COOKIE),
}

export const pinterestConfig = {
  isConfigured: () => Boolean(config.PINTEREST_ACCESS_TOKEN && config.PINTEREST_DEFAULT_BOARD_ID),
}

export const storageConfig = {
  isS3: () => config.STORAGE_DRIVER === 's3',
  isLocal: () => config.STORAGE_DRIVER === 'local',
}
