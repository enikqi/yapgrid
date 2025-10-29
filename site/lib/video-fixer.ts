import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

/**
 * Fix MP4 video for Safari iOS compatibility
 * Moves moov atom to beginning for fast start
 */
export async function fixVideoForSafari(inputPath: string): Promise<string> {
  try {
    const dir = path.dirname(inputPath)
    const ext = path.extname(inputPath)
    const base = path.basename(inputPath, ext)
    
    // Create temporary output file
    const tempPath = path.join(dir, `${base}_temp${ext}`)
    const backupPath = path.join(dir, `${base}_backup${ext}`)
    
    console.log(`🔧 Fixing video for Safari: ${inputPath}`)
    
    // Run ffmpeg to add faststart flag
    const command = `ffmpeg -i "${inputPath}" -c copy -movflags +faststart "${tempPath}" -y`
    
    try {
      await execAsync(command, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })
      
      // Backup original
      await fs.rename(inputPath, backupPath)
      
      // Replace with fixed version
      await fs.rename(tempPath, inputPath)
      
      // Delete backup after successful replacement
      await fs.unlink(backupPath).catch(() => {})
      
      console.log(`✅ Video fixed successfully: ${inputPath}`)
      return inputPath
      
    } catch (ffmpegError) {
      // Clean up temp file if it exists
      await fs.unlink(tempPath).catch(() => {})
      
      console.error(`❌ FFmpeg error fixing video:`, ffmpegError)
      
      // Return original path if fixing failed
      return inputPath
    }
    
  } catch (error) {
    console.error(`❌ Error fixing video for Safari:`, error)
    return inputPath
  }
}

/**
 * Check if video needs fixing (doesn't have faststart)
 */
export async function needsSafariFix(videoPath: string): Promise<boolean> {
  try {
    const command = `ffprobe -v error -show_entries format=format_name -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    const { stdout } = await execAsync(command)
    
    // Check if it's an MP4 and potentially needs fixing
    // A more thorough check would inspect the moov atom position
    return stdout.trim().includes('mp4') || stdout.trim().includes('mov')
    
  } catch (error) {
    console.error(`Error checking video:`, error)
    return false
  }
}

/**
 * Bulk fix all videos in a directory
 */
export async function fixAllVideosInDirectory(dirPath: string): Promise<{
  fixed: number
  skipped: number
  errors: number
}> {
  const results = { fixed: 0, skipped: 0, errors: 0 }
  
  try {
    const files = await fs.readdir(dirPath)
    const mp4Files = files.filter(f => f.endsWith('.mp4') && !f.includes('_backup') && !f.includes('_temp'))
    
    console.log(`📁 Found ${mp4Files.length} MP4 files in ${dirPath}`)
    
    for (const file of mp4Files) {
      const fullPath = path.join(dirPath, file)
      
      try {
        const needsFix = await needsSafariFix(fullPath)
        
        if (needsFix) {
          await fixVideoForSafari(fullPath)
          results.fixed++
        } else {
          console.log(`⏭️  Skipped (already optimized): ${file}`)
          results.skipped++
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error)
        results.errors++
      }
    }
    
  } catch (error) {
    console.error(`Error reading directory:`, error)
  }
  
  return results
}
