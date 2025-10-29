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

    const { postId, voteType } = await request.json()

    if (!postId || !voteType || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request. postId and voteType (upvote/downvote) are required' 
      }, { status: 400 })
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    // Check if user already voted on this post
    const existingVote = await prisma.postVote.findFirst({
      where: {
        postId: postId,
        userEmail: session.user.email
      }
    })

    if (existingVote) {
      // If same vote type, remove the vote
      if (existingVote.voteType === voteType) {
        await prisma.postVote.delete({
          where: { id: existingVote.id }
        })

        // Update post score
        const scoreChange = voteType === 'upvote' ? -1 : 1
        await prisma.post.update({
          where: { id: postId },
          data: { score: Math.max(0, post.score + scoreChange) }
        })

        return NextResponse.json({
          success: true,
          action: 'removed',
          voteType: null,
          newScore: Math.max(0, post.score + scoreChange)
        })
      } else {
        // If different vote type, update the vote
        await prisma.postVote.update({
          where: { id: existingVote.id },
          data: { voteType: voteType }
        })

        // Update post score (remove old vote, add new vote)
        const scoreChange = existingVote.voteType === 'upvote' ? -2 : 2 // -1 for removing old, +1/-1 for new
        const newScore = Math.max(0, post.score + scoreChange)
        
        await prisma.post.update({
          where: { id: postId },
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
      await prisma.postVote.create({
        data: {
          postId: postId,
          userEmail: session.user.email,
          voteType: voteType
        }
      })

      // Update post score
      const scoreChange = voteType === 'upvote' ? 1 : -1
      const newScore = Math.max(0, post.score + scoreChange)
      
      await prisma.post.update({
        where: { id: postId },
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
    console.error('Error handling vote:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Vote system temporarily unavailable' 
    }, { status: 503 })
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
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ 
        success: false, 
        error: 'postId is required' 
      }, { status: 400 })
    }

    // Get user's vote for this post
    const vote = await prisma.postVote.findFirst({
      where: {
        postId: postId,
        userEmail: session.user.email
      }
    })

    return NextResponse.json({
      success: true,
      voteType: vote?.voteType || null
    })

  } catch (error) {
    console.error('Error getting vote:', error)
    return NextResponse.json({ 
      success: true, 
      voteType: null 
    })
  } finally {
    await prisma.$disconnect()
  }
}
