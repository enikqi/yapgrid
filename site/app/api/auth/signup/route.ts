import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/auth/signup')

export async function POST(request: NextRequest) {
  try {
    const { name, username, email, password } = await request.json()

    // Validate required fields
    if (!name || !username || !email || !password) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Validate username format (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        success: false,
        error: 'Username can only contain letters, numbers, and underscores'
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: existingUser.email === email 
          ? 'Email already exists' 
          : 'Username already taken'
      }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        createdAt: true,
      }
    })

    logger.info('User created successfully', { userId: user.id, username: user.username })

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    logger.error('Signup failed', { error })
    return NextResponse.json({
      success: false,
      error: 'Failed to create account'
    }, { status: 500 })
  }
}
