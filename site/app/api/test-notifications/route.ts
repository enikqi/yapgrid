import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Create test notifications
    const notifications = [
      {
        userId: user.id,
        type: 'comment',
        title: 'New comment on your post',
        message: 'John commented on your post in r/confidentlyincorrect',
        link: '/post/test123'
      },
      {
        userId: user.id,
        type: 'upvote',
        title: 'Post upvoted',
        message: 'Sarah upvoted your post: "Amazing content!"',
        link: '/post/test456'
      },
      {
        userId: user.id,
        type: 'new_post',
        title: 'New post in your community',
        message: 'New post in r/nextfuckinglevel: "Check this out!"',
        link: '/post/test789'
      },
      {
        userId: user.id,
        type: 'reply',
        title: 'New reply to your comment',
        message: 'Mike replied to your comment on "Interesting discussion"',
        link: '/post/test321'
      },
      {
        userId: user.id,
        type: 'community_update',
        title: 'Community update',
        message: 'r/trending has reached 1M members!',
        link: '/r/trending'
      }
    ]

    const createdNotifications = await Promise.all(
      notifications.map(n => prisma.notification.create({ data: n }))
    )

    return NextResponse.json({
      success: true,
      data: {
        message: `Created ${createdNotifications.length} test notifications`,
        notifications: createdNotifications
      }
    })
  } catch (error) {
    console.error('Failed to create test notifications:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create test notifications' 
    }, { status: 500 })
  }
}

