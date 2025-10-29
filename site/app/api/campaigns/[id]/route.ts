import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/campaigns-id')

// GET /api/campaigns/[id] - Get a specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: campaign })
  } catch (error) {
    logger.error('Failed to fetch campaign', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

// PUT /api/campaigns/[id] - Update a specific campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const body = await request.json()
    const { name, subreddits, keywords, excludeKeywords, minScore, maxScore, sortBy, timeRange, includeNsfw, postLimit, enabled } = body

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name,
        subreddits,
        keywords,
        excludeKeywords,
        minScore,
        maxScore,
        sortBy,
        timeRange,
        includeNsfw,
        postLimit,
        enabled,
      },
    })

    logger.info({ campaignId, name: updatedCampaign.name }, 'Campaign updated')
    return NextResponse.json({ success: true, data: updatedCampaign })
  } catch (error) {
    logger.error('Failed to update campaign', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id] - Delete a specific campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Delete the campaign
    await prisma.campaign.delete({
      where: { id: campaignId },
    })

    logger.info({ campaignId, name: campaign.name }, 'Campaign deleted')
    return NextResponse.json({
      success: true,
      data: {
        message: 'Campaign deleted successfully',
      },
    })
  } catch (error) {
    logger.error('Failed to delete campaign', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
