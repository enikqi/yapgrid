import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'
import type { ApiResponse, AppSettings } from '@/lib/types'

const logger = createLogger('api/admin/settings')

const defaultSettings: AppSettings = {
  subreddits: [],
  keywords: [],
  minUpvotes: 100,
  includeNsfw: false,
  maxDuration: 900,
  maxFilesize: 400,
  watermarkEnabled: false,
  autoIngest: false,
  autoPublish: false,
  requireApproval: false,
  titleTemplate: '{title}',
  descriptionTemplate: '{title} • r/{subreddit} | Source: https://reddit.com{permalink}',
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get all settings from database
    const settings = await prisma.setting.findMany()
    
    // Merge with defaults
    const mergedSettings = { ...defaultSettings }
    
    settings.forEach(setting => {
      if (setting.key in mergedSettings) {
        const value = setting.value
        
        // Convert string values to appropriate types
        if (typeof (defaultSettings as any)[setting.key] === 'boolean') {
          (mergedSettings as any)[setting.key] = value === 'true'
        } else if (typeof (defaultSettings as any)[setting.key] === 'number') {
          (mergedSettings as any)[setting.key] = parseInt(value) || (defaultSettings as any)[setting.key]
        } else if (setting.key === 'subreddits' || setting.key === 'keywords') {
          try {
            (mergedSettings as any)[setting.key] = JSON.parse(value)
          } catch {
            (mergedSettings as any)[setting.key] = (defaultSettings as any)[setting.key]
          }
        } else {
          (mergedSettings as any)[setting.key] = value
        }
      }
    })

    const response: ApiResponse<AppSettings> = {
      success: true,
      data: mergedSettings,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to get settings')
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get settings',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body: AppSettings = await request.json()

    // Save each setting
    const operations = Object.entries(body).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    })

    await Promise.all(operations)

    logger.info('Settings updated successfully')

    const response: ApiResponse = {
      success: true,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to update settings')
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update settings',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
