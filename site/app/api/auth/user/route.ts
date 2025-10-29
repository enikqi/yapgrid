import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db/prisma'
import { authOptions } from '@/lib/auth'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/auth/user')

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 })
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        karma: true,
        isAdmin: true,
        createdAt: true,
      }
    })

    // If user doesn't exist, create them
    if (!user) {
      const username = session.user.name?.toLowerCase().replace(/\s+/g, '_') || 'user'
      
      // Ensure username is unique
      let finalUsername = username
      let counter = 1
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${username}_${counter}`
        counter++
      }

      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name,
          username: finalUsername,
          image: session.user.image,
          karma: 0,
          isAdmin: false,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          karma: true,
          isAdmin: true,
          createdAt: true,
        }
      })

      logger.info({ userId: user.id, username: user.username }, 'New user created via Google OAuth')
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    logger.error({ error }, 'Failed to create/fetch user')
    return NextResponse.json({
      success: false,
      error: 'Failed to process user'
    }, { status: 500 })
  }
}
