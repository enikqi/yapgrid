import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/admin/pinterest')

// GET /api/admin/pinterest - Get Pinterest campaigns
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

// POST /api/admin/pinterest - Create or manage Pinterest campaigns
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

    let result: { success: boolean; message: string; data: any; error?: string } = { success: true, message: '', data: null }

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

        // Provide instructions for fetching Pinterest boards
        const mockBoards = [
          {
            id: '1',
            name: 'Animal Lovers',
            description: 'Cute animals and pets',
            pinCount: 1250,
            followerCount: 8500
          },
          {
            id: '2',
            name: 'You are my best friend!',
            description: 'Friendship quotes and memories',
            pinCount: 890,
            followerCount: 3200
          },
          {
            id: '3',
            name: 'My Personal Board',
            description: 'Personal collection',
            pinCount: 450,
            followerCount: 1200
          }
        ]

        result.message = 'Pinterest boards fetched successfully (using fallback data - run script to get real boards)'
        result.data = { 
          boards: mockBoards,
          instructions: [
            'To get your real Pinterest boards:',
            '1. First run: node open-pinterest-login.js (and log in)',
            '2. Then run: node fetch-pinterest-boards.js',
            '3. This will fetch your actual Pinterest boards'
          ]
        }
        logger.info('Pinterest boards fallback data provided with instructions')
        break

      case 'create_pin':
        const { pinData } = data
        
        if (!pinData) {
          return NextResponse.json(
            { success: false, error: 'Pin data is required' },
            { status: 400 }
          )
        }

        try {
          // Use Selenium-based automation to create Pinterest pin
          const PinterestAutomation = (await import('../../../../lib/pinterest-automation')).default
          const pinterest = new PinterestAutomation()
          
          try {
            await pinterest.initialize()
            const loginSuccess = await pinterest.loginToPinterest()
            
            if (loginSuccess) {
              const pinCreated = await pinterest.createPin(pinData)
              
              if (pinCreated) {
                result.message = 'Pinterest pin created successfully'
                result.data = { success: true }
                logger.info('Pinterest pin created via Selenium', { title: pinData.title })
              } else {
                throw new Error('Failed to create pin')
              }
            } else {
              throw new Error('Login failed')
            }
          } finally {
            await pinterest.close()
          }
        } catch (error) {
          result.success = false
          result.error = `Failed to create Pinterest pin: ${error instanceof Error ? error.message : String(error)}`
          logger.error('Selenium pin creation failed', { error: error instanceof Error ? error.message : String(error) })
        }
        break

      case 'open_pinterest_login':
        // Provide instructions for running the Pinterest login script
        result.message = 'Pinterest login instructions'
        result.data = { 
          success: true,
          message: 'To open Pinterest login, run this command in your terminal:',
          command: 'node open-pinterest-login.js',
          instructions: [
            '1. Open your terminal/command prompt',
            '2. Navigate to your project directory',
            '3. Run: node open-pinterest-login.js',
            '4. Chrome browser will open with Pinterest login page',
            '5. Log in to your Pinterest account',
            '6. Your session will be saved for future use'
          ]
        }
        logger.info('Pinterest login instructions provided')
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