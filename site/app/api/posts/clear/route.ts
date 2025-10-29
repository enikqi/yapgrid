import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { promises as fs } from 'fs'
import path from 'path'

export async function DELETE(request: NextRequest) {
  try {
    console.log('Clearing all posts and assets...')
    
    // Delete all assets first (foreign key constraint)
    await prisma.asset.deleteMany()
    console.log('Deleted all assets')
    
    // Delete all posts
    await prisma.post.deleteMany()
    console.log('Deleted all posts')
    
    // Clear media directory
    const mediaDir = path.join(process.cwd(), 'media')
    try {
      const files = await fs.readdir(mediaDir)
      for (const file of files) {
        await fs.unlink(path.join(mediaDir, file))
      }
      console.log('Cleared media directory')
    } catch (error) {
      console.log('Media directory already empty or does not exist')
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'All posts, assets, and media files cleared successfully' 
    })
    
  } catch (error) {
    console.error('Error clearing posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear posts' },
      { status: 500 }
    )
  }
}
