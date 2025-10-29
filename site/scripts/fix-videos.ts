import path from 'path'
import { fixAllVideosInDirectory } from '../lib/video-fixer'

async function main() {
  const mediaDir = path.join(process.cwd(), 'media')
  
  console.log('🎬 Starting video optimization for Safari iOS...')
  console.log(`📂 Media directory: ${mediaDir}\n`)
  
  const results = await fixAllVideosInDirectory(mediaDir)
  
  console.log('\n📊 Results:')
  console.log(`  ✅ Fixed: ${results.fixed}`)
  console.log(`  ⏭️  Skipped: ${results.skipped}`)
  console.log(`  ❌ Errors: ${results.errors}`)
  console.log('\n🎉 Done!')
}

main().catch(console.error)
