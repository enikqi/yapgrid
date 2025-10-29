import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId, voteType } = await request.json()

    if (!commentId || !voteType || !['UPVOTE', 'DOWNVOTE'].includes(voteType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request. commentId and voteType (UPVOTE/DOWNVOTE) are required' 
      }, { status: 400 })
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 })
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check if user already voted on this comment
    const existingVote = await prisma.vote.findFirst({
      where: {
        commentId: commentId,
        userId: user.id
      }
    })

    if (existingVote) {
      // If same vote type, remove the vote
      if (existingVote.type === voteType) {
        await prisma.vote.delete({
          where: { id: existingVote.id }
        })

        // Update comment score
        const scoreChange = voteType === 'UPVOTE' ? -1 : 1
        await prisma.comment.update({
          where: { id: commentId },
          data: { score: Math.max(0, comment.score + scoreChange) }
        })

        return NextResponse.json({
          success: true,
          action: 'removed',
          voteType: null,
          newScore: Math.max(0, comment.score + scoreChange)
        })
      } else {
        // If different vote type, update the vote
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: voteType }
        })

        // Update comment score (remove old vote, add new vote)
        const scoreChange = existingVote.type === 'UPVOTE' ? -2 : 2 // -1 for removing old, +1/-1 for new
        const newScore = Math.max(0, comment.score + scoreChange)
        
        await prisma.comment.update({
          where: { id: commentId },
          data: { score: newScore }
        })

        return NextResponse.json({
          success: true,
          action: 'changed',
          voteType: voteType,
          newScore: newScore
        })
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          userId: user.id,
          commentId: commentId,
          type: voteType
        }
      })

      // Update comment score
      const scoreChange = voteType === 'UPVOTE' ? 1 : -1
      const newScore = Math.max(0, comment.score + scoreChange)
      
      await prisma.comment.update({
        where: { id: commentId },
        data: { score: newScore }
      })

      return NextResponse.json({
        success: true,
        action: 'added',
        voteType: voteType,
        newScore: newScore
      })
    }

  } catch (error) {
    console.error('Error handling comment vote:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'commentId is required' 
      }, { status: 400 })
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get user's vote for this comment
    const vote = await prisma.vote.findFirst({
      where: {
        commentId: commentId,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      voteType: vote?.type || null
    })

  } catch (error) {
    console.error('Error getting comment vote:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
