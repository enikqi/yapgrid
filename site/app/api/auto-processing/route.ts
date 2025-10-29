import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/auto-processing')

// GET /api/auto-processing - Get auto-processing configuration
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'auto_processing_enabled',
            'auto_processing_delay_seconds',
            'auto_processing_batch_size'
          ]
        }
      }
    })

    const config = {
      enabled: false,
      delaySeconds: 10,
      batchSize: 1
    }

    settings.forEach(setting => {
      switch (setting.key) {
        case 'auto_processing_enabled':
          config.enabled = setting.value as boolean
          break
        case 'auto_processing_delay_seconds':
          config.delaySeconds = setting.value as number
          break
        case 'auto_processing_batch_size':
          config.batchSize = setting.value as number
          break
      }
    })

    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get auto-processing config')
    return NextResponse.json(
      { success: false, error: 'Failed to get auto-processing config' },
      { status: 500 }
    )
  }
}

// POST /api/auto-processing - Update auto-processing configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, delaySeconds, batchSize } = body

    // Validate input
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled must be a boolean' },
        { status: 400 }
      )
    }

    if (typeof delaySeconds !== 'number' || delaySeconds < 1 || delaySeconds > 300) {
      return NextResponse.json(
        { success: false, error: 'delaySeconds must be between 1 and 300' },
        { status: 400 }
      )
    }

    if (typeof batchSize !== 'number' || batchSize < 1 || batchSize > 10) {
      return NextResponse.json(
        { success: false, error: 'batchSize must be between 1 and 10' },
        { status: 400 }
      )
    }

    // Update settings
    await Promise.all([
      prisma.setting.upsert({
        where: { key: 'auto_processing_enabled' },
        update: { value: enabled },
        create: { key: 'auto_processing_enabled', value: enabled }
      }),
      prisma.setting.upsert({
        where: { key: 'auto_processing_delay_seconds' },
        update: { value: delaySeconds },
        create: { key: 'auto_processing_delay_seconds', value: delaySeconds }
      }),
      prisma.setting.upsert({
        where: { key: 'auto_processing_batch_size' },
        update: { value: batchSize },
        create: { key: 'auto_processing_batch_size', value: batchSize }
      })
    ])

    logger.info({ enabled, delaySeconds, batchSize }, 'Auto-processing config updated')

    return NextResponse.json({
      success: true,
      data: {
        enabled,
        delaySeconds,
        batchSize,
        message: 'Auto-processing configuration updated successfully'
      }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to update auto-processing config')
    return NextResponse.json(
      { success: false, error: 'Failed to update auto-processing config' },
      { status: 500 }
    )
  }
}
