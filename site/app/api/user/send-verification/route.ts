import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { emailVerified: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store token in database
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: user.email!,
          token: token
        }
      },
      create: {
        identifier: user.email!,
        token: token,
        expires: expires
      },
      update: {
        expires: expires
      }
    })

    // Generate verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/user/verify-email?token=${token}&email=${encodeURIComponent(user.email!)}`

    // For now, log the verification link (in production, send via email)
    console.log('='.repeat(80))
    console.log('📧 EMAIL VERIFICATION LINK')
    console.log('='.repeat(80))
    console.log(`To: ${user.email}`)
    console.log(`Link: ${verificationUrl}`)
    console.log('='.repeat(80))

    // TODO: In production, integrate with an email service (SendGrid, AWS SES, etc.)
    // For now, we'll return the link in the response for testing
    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent! Check the server logs for the verification link.',
      // In production, remove this:
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    })
  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}

