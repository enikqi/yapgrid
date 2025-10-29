const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 RESTARTING ALL SYSTEMS...')

// Kill existing processes
const { exec } = require('child_process')

exec('taskkill /F /IM node.exe', (error) => {
  if (error) {
    console.log('No existing processes to kill')
  } else {
    console.log('✅ Killed existing processes')
  }
  
  // Wait 2 seconds then start new processes
  setTimeout(() => {
    console.log('🔄 Starting new processes...')
    
    // Start Next.js server
    const nextjs = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore'
    })
    console.log('✅ Next.js server started')
    
    // Start auto-publish system
    const autoPublish = spawn('node', ['auto-publish-system.js'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore'
    })
    console.log('✅ Auto-publish system started')
    
    // Start continuous processor
    const continuous = spawn('node', ['continuous-processor.js'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore'
    })
    console.log('✅ Continuous processor started')
    
    // Start slow integrated system
    const slowSystem = spawn('node', ['slow-integrated-system.js'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore'
    })
    console.log('✅ Slow integrated system started')
    
    console.log('\n🎉 ALL SYSTEMS RESTARTED!')
    console.log('📊 Systems running:')
    console.log('  - Next.js server (port 3002)')
    console.log('  - Auto-publish (10 posts/minute)')
    console.log('  - Continuous processor (every 30s)')
    console.log('  - Slow integrated system (every 5min)')
    
    // Exit this script
    process.exit(0)
  }, 2000)
})
