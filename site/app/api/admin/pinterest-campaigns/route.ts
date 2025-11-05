import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/admin/pinterest-campaigns')

// GET /api/admin/pinterest-campaigns - Get Pinterest campaigns
export async function GET() {
  try {
    const pinterestCampaigns = await prisma.pinterestCampaign.findMany({
      include: {
        campaign: true,
        pinterestPosts: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get all available campaigns for dropdown
    const campaigns = await prisma.campaign.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
        subreddits: true,
        keywords: true
      },
      orderBy: { name: 'asc' }
    })

    logger.info('Pinterest campaigns data fetched', { 
      pinterestCampaignsCount: pinterestCampaigns.length,
      campaignsCount: campaigns.length
    })

    return NextResponse.json({
      success: true,
      data: {
        pinterestCampaigns,
        campaigns
      }
    })

  } catch (error) {
    logger.error('Failed to fetch Pinterest campaigns', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Pinterest campaigns' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/admin/pinterest-campaigns - Create or manage Pinterest campaigns
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    let result: { success: boolean; message: string; data: any } = { success: true, message: '', data: null }

    switch (action) {
      case 'create_campaign':
        const { name, campaignId, sessionId, boardName, scheduleInterval } = data
        
        if (!name || !campaignId || !sessionId || !boardName) {
          return NextResponse.json(
            { success: false, error: 'Name, campaign ID, session ID, and board name are required' },
            { status: 400 }
          )
        }

        const newPinterestCampaign = await prisma.pinterestCampaign.create({
          data: {
            name,
            campaignId,
            sessionId,
            boardName,
            scheduleInterval: scheduleInterval || 60,
            enabled: true,
            nextRun: new Date(Date.now() + (scheduleInterval || 60) * 60 * 1000)
          },
          include: {
            campaign: true
          }
        })

        result.message = `Pinterest campaign "${name}" created successfully`
        result.data = newPinterestCampaign
        logger.info('Pinterest campaign created', { campaignId: newPinterestCampaign.id })
        break

      case 'update_campaign':
        const { id, ...updateData } = data
        
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Campaign ID is required' },
            { status: 400 }
          )
        }

        const updatedCampaign = await prisma.pinterestCampaign.update({
          where: { id },
          data: updateData,
          include: {
            campaign: true
          }
        })

        result.message = 'Pinterest campaign updated successfully'
        result.data = updatedCampaign
        logger.info('Pinterest campaign updated', { campaignId: id })
        break

      case 'delete_campaign':
        const { campaignId: deleteCampaignId } = data
        
        if (!deleteCampaignId) {
          return NextResponse.json(
            { success: false, error: 'Campaign ID is required' },
            { status: 400 }
          )
        }

        await prisma.pinterestCampaign.delete({
          where: { id: deleteCampaignId }
        })

        result.message = 'Pinterest campaign deleted successfully'
        logger.info('Pinterest campaign deleted', { campaignId: deleteCampaignId })
        break

      case 'toggle_campaign':
        const { toggleId, enabled } = data
        
        if (!toggleId) {
          return NextResponse.json(
            { success: false, error: 'Campaign ID is required' },
            { status: 400 }
          )
        }

        const toggledCampaign = await prisma.pinterestCampaign.update({
          where: { id: toggleId },
          data: { enabled },
          include: {
            campaign: true
          }
        })

        result.message = `Pinterest campaign ${enabled ? 'enabled' : 'disabled'} successfully`
        result.data = toggledCampaign
        logger.info('Pinterest campaign toggled', { campaignId: toggleId, enabled })
        break

      case 'fetch_boards':
        const { sessionId: fetchSessionId } = data
        
        if (!fetchSessionId) {
          return NextResponse.json(
            { success: false, error: 'Session ID is required' },
            { status: 400 }
          )
        }

        // Mock Pinterest boards fetch (replace with actual Pinterest API call)
        const mockBoards = [
          {
            id: '1',
            name: 'Reddit Content',
            description: 'Content from Reddit',
            pinCount: Math.floor(Math.random() * 1000 + 100),
            followerCount: Math.floor(Math.random() * 5000 + 500)
          },
          {
            id: '2',
            name: 'Memes',
            description: 'Funny memes and jokes',
            pinCount: Math.floor(Math.random() * 2000 + 200),
            followerCount: Math.floor(Math.random() * 10000 + 1000)
          },
          {
            id: '3',
            name: 'Tech',
            description: 'Technology and programming',
            pinCount: Math.floor(Math.random() * 1500 + 150),
            followerCount: Math.floor(Math.random() * 8000 + 800)
          },
          {
            id: '4',
            name: 'Funny Videos',
            description: 'Funny and entertaining videos',
            pinCount: Math.floor(Math.random() * 3000 + 300),
            followerCount: Math.floor(Math.random() * 15000 + 1500)
          }
        ]

        result.message = 'Pinterest boards fetched successfully'
        result.data = { boards: mockBoards }
        logger.info('Pinterest boards fetched', { sessionId: fetchSessionId.substring(0, 20) + '...' })
        break

      case 'test_session':
        const { sessionId: testSessionId } = data
        
        if (!testSessionId) {
          return NextResponse.json(
            { success: false, error: 'Session ID is required' },
            { status: 400 }
          )
        }

        // Mock session validation (replace with actual Pinterest API call)
        result.message = 'Pinterest session is valid!'
        logger.info('Pinterest session tested', { sessionId: testSessionId.substring(0, 20) + '...' })
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result.success,
      data: result.data || { message: result.message }
    })

  } catch (error) {
    logger.error('Failed to execute Pinterest campaign action', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to execute Pinterest campaign action' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
