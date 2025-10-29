import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized',
        data: { notifications: [], unreadCount: 0, total: 0, page: 1, hasMore: false }
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        data: { notifications: [], unreadCount: 0, total: 0, page: 1, hasMore: false }
      }, { status: 404 })
    }

    const where = {
      userId: user.id,
      ...(unreadOnly && { isRead: false })
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where })
    ])

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    })

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total,
        page,
        hasMore: total > page * limit
      }
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST - Mark notification as read or mark all as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationId } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (action === 'markAllRead') {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true }
      })
    } else if (action === 'markRead' && notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json({ success: false, error: 'Failed to update notification' }, { status: 500 })
  }
}

