import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(request: NextRequest) {
  try {
    const mediaDir = join(process.cwd(), 'public', 'media')
    
    // Check if media directory exists
    if (!existsSync(mediaDir)) {
      return NextResponse.json({
        success: true,
        files: []
      })
    }

    // Read all files in the media directory
    const files = await readdir(mediaDir)
    
    // Filter out .gitkeep and other hidden files
    const visibleFiles = files.filter(filename => !filename.startsWith('.'))
    
    // Get file stats for each file
    const fileDetails = await Promise.all(
      visibleFiles.map(async (filename) => {
        const filepath = join(mediaDir, filename)
        const stats = await stat(filepath)
        
        // Determine file type based on extension
        const ext = filename.split('.').pop()?.toLowerCase() || ''
        let type = 'application/octet-stream'
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
          type = `image/${ext === 'jpg' ? 'jpeg' : ext}`
        } else if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) {
          type = `video/${ext}`
        }
        
        return {
          name: filename,
          originalName: filename,
          size: stats.size,
          type: type,
          url: `/media/${filename}`,
          path: filepath,
          uploadedAt: stats.mtime.toISOString()
        }
      })
    )
    
    // Sort by upload date (newest first)
    fileDetails.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
    
    return NextResponse.json({
      success: true,
      files: fileDetails,
      total: fileDetails.length
    })

  } catch (error) {
    console.error('Error listing media files:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to list media files' },
      { status: 500 }
    )
  }
}
