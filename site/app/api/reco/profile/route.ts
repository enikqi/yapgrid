import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import type { UserProfile } from '@/lib/event-tracker'

const logger = createLogger('api/reco/profile')

// GET /api/reco/profile - Get user recommendation profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Get user's recommendation profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    })

    const defaultProfile: UserProfile = {
      subredditWeights: {},
      keywordWeights: {},
      authorWeights: {},
      interactionHistory: [],
      preferences: {
        personalizedFeed: true,
        diversityLevel: 0.3
      }
    }

    const userProfile = profile ? JSON.parse(profile.profileData) : defaultProfile

    logger.info({ userId: user.id }, 'Retrieved user recommendation profile')

    return NextResponse.json({
      success: true,
      data: {
        profile: userProfile
      }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get user profile')
    return NextResponse.json(
      { success: false, error: 'Failed to get user profile' },
      { status: 500 }
    )
  }
}

// POST /api/reco/profile - Update user recommendation profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    const body = await request.json()
    const { profile } = body

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile data is required'
      }, { status: 400 })
    }

    // Upsert user profile
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        profileData: JSON.stringify(profile),
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        profileData: JSON.stringify(profile),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    logger.info({ userId: user.id }, 'Updated user recommendation profile')

    return NextResponse.json({
      success: true,
      data: {
        message: 'Profile updated successfully'
      }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to update user profile')
    return NextResponse.json(
      { success: false, error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}
