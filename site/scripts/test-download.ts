import { spawn } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const exec = promisify(require('child_process').exec)

async function testDownload() {
  const url = 'https://v.redd.it/8n3sx9sib2wf1'
  const outputDir = path.join(process.cwd(), 'temp')
  const outputPath = path.join(outputDir, 'test-video.mp4')

  try {
    // Create temp directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true })

    console.log('Starting video download with yt-dlp...')
    
    // Use yt-dlp to download the video
    const command = `yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' -o "${outputPath}" "${url}"`
    console.log('Running command:', command)
    
    const { stdout, stderr } = await exec(command)
    
    console.log('Download completed successfully')
    console.log('stdout:', stdout)
    console.log('stderr:', stderr)
    
    // Check if file was downloaded
    const stats = await fs.stat(outputPath)
    console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`)
    
  } catch (error) {
    console.error('Error downloading video:', error)
    if (error.stderr) console.error('stderr:', error.stderr)
    if (error.stdout) console.log('stdout:', error.stdout)
  }
}

testDownload()
  .then(() => console.log('Test completed'))
  .catch(console.error)
