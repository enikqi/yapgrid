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
      max_memory_restart: '800M',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/home/ubuntu/apps/yapgrid/logs/web-error.log',
      out_file: '/home/ubuntu/apps/yapgrid/logs/web-out.log',
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Log rotation
      log_file: '/home/ubuntu/apps/yapgrid/logs/web-combined.log',
      max_size: '50M',
      retain: 7, // Keep last 7 log files
      compress: true,
      // Performance monitoring
      exp_backoff_restart_delay: 100
    }
  ]
}
