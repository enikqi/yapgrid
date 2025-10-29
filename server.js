const { spawn } = require('child_process');
const path = require('path');

const port = 3002;

console.log('🚀 Starting YapGrid...');
console.log(`📂 Working directory: ${path.join(__dirname, 'site')}`);

// Start Next.js development server for now
const nextProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'site'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: port.toString()
  }
});

nextProcess.on('error', (error) => {
  console.error('❌ Error starting Next.js:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.error(`❌ Next.js exited with code ${code}`);
  process.exit(1);
});

console.log(`✅ YapGrid starting on http://0.0.0.0:${port}`);
console.log('✅ Site will be LIVE at https://yapgrid.com');