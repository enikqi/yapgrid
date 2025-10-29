import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subreddit = searchParams.get('subreddit')

    if (subreddit) {
      // Get post count for specific subreddit
      const count = await prisma.post.count({
        where: {
          subreddit: subreddit,
          status: 'PUBLISHED'
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          subreddit,
          postCount: count
        }
      })
    } else {
      // Get post counts for all subreddits
      const subredditCounts = await prisma.post.groupBy({
        by: ['subreddit'],
        where: {
          status: 'PUBLISHED'
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })

      const countsMap = subredditCounts.reduce((acc, item) => {
        acc[item.subreddit] = item._count.id
        return acc
      }, {} as Record<string, number>)

      return NextResponse.json({
        success: true,
        data: countsMap
      })
    }

  } catch (error) {
    console.error('Error fetching subreddit post counts:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
