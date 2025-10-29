module.exports = {
  apps: [
    {
      name: 'yapgrid-nextjs',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      cwd: '/home/ubuntu/apps/yapgrid/site',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/home/ubuntu/apps/yapgrid/logs/web-error.log',
      out_file: '/home/ubuntu/apps/yapgrid/logs/web-out.log',
      time: true
    }
  ]
}
