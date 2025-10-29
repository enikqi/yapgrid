import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/subscriptions')

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subreddit = searchParams.get('subreddit')

    if (subreddit) {
      // Check if user is subscribed to specific subreddit
      const subscription = await prisma.subscription.findUnique({
        where: {
          userId_subreddit: {
            userId: session.user.id!,
            subreddit: subreddit
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          subscribed: !!subscription,
          subscription
        }
      })
    } else {
      // Get all user subscriptions
      const subscriptions = await prisma.subscription.findMany({
        where: {
          userId: session.user.id!
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          subscriptions: subscriptions.map(sub => sub.subreddit)
        }
      })
    }

  } catch (error) {
    logger.error({ error }, 'Failed to fetch subscriptions')
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subscriptions'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { subreddit, action } = await request.json()

    if (!subreddit || !action) {
      return NextResponse.json({
        success: false,
        error: 'Subreddit and action are required'
      }, { status: 400 })
    }

    if (action === 'join') {
      // Create new subscription (let database handle unique constraint)
      try {
        const subscription = await prisma.subscription.create({
          data: {
            userId: session.user.id!,
            subreddit: subreddit
          }
        })

        logger.info({ userId: session.user.id, subreddit }, 'User joined community')

        return NextResponse.json({
          success: true,
          data: {
            subscribed: true,
            subscription,
            message: 'Successfully joined community'
          }
        })
      } catch (error: any) {
        // Handle unique constraint violation (already subscribed)
        if (error.code === 'P2002') {
          return NextResponse.json({
            success: true,
            data: {
              subscribed: true,
              message: 'Already subscribed to this community'
            }
          })
        }
        throw error
      }

    } else if (action === 'leave') {
      // Remove subscription
      const deletedSubscription = await prisma.subscription.deleteMany({
        where: {
          userId: session.user.id!,
          subreddit: subreddit
        }
      })

      logger.info({ userId: session.user.id, subreddit }, 'User left community')

      return NextResponse.json({
        success: true,
        data: {
          subscribed: false,
          message: 'Successfully left community'
        }
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "join" or "leave"'
      }, { status: 400 })
    }

  } catch (error) {
    logger.error({ error }, 'Failed to update subscription')
    return NextResponse.json({
      success: false,
      error: 'Failed to update subscription'
    }, { status: 500 })
  }
}
