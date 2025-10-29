import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/auto-posting')

// GET /api/auto-posting - Get auto-posting configuration
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'autoPublish',
            'autoPublishIntervalMinutes',
            'autoPublishBatchSize'
          ]
        }
      }
    })

    const config = {
      enabled: false,
      intervalMinutes: 30,
      batchSize: 1
    }

    settings.forEach(setting => {
      switch (setting.key) {
        case 'autoPublish':
          config.enabled = setting.value === 'true'
          break
        case 'autoPublishIntervalMinutes':
          config.intervalMinutes = parseInt(setting.value)
          break
        case 'autoPublishBatchSize':
          config.batchSize = parseInt(setting.value)
          break
      }
    })

    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get auto-posting config')
    return NextResponse.json(
      { success: false, error: 'Failed to get auto-posting config' },
      { status: 500 }
    )
  }
}

// POST /api/auto-posting - Update auto-posting configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, intervalMinutes, batchSize } = body

    // Validate input
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled must be a boolean' },
        { status: 400 }
      )
    }

    if (typeof intervalMinutes !== 'number' || intervalMinutes < 1 || intervalMinutes > 60) {
      return NextResponse.json(
        { success: false, error: 'intervalMinutes must be between 1 and 60' },
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
        where: { key: 'autoPublish' },
        update: { value: enabled.toString() },
        create: { key: 'autoPublish', value: enabled.toString() }
      }),
      prisma.setting.upsert({
        where: { key: 'autoPublishIntervalMinutes' },
        update: { value: intervalMinutes.toString() },
        create: { key: 'autoPublishIntervalMinutes', value: intervalMinutes.toString() }
      }),
      prisma.setting.upsert({
        where: { key: 'autoPublishBatchSize' },
        update: { value: batchSize.toString() },
        create: { key: 'autoPublishBatchSize', value: batchSize.toString() }
      })
    ])

    logger.info({ enabled, intervalMinutes, batchSize }, 'Auto-posting config updated')

    return NextResponse.json({
      success: true,
      data: {
        enabled,
        intervalMinutes,
        batchSize,
        message: 'Auto-posting configuration updated successfully'
      }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to update auto-posting config')
    return NextResponse.json(
      { success: false, error: 'Failed to update auto-posting config' },
      { status: 500 }
    )
  }
}
