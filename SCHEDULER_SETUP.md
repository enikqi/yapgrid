# Background Scheduler Setup

## Overview
The background scheduler runs three cron jobs:
- **Auto-processing**: Processes NEW posts to READY status (every 2 minutes)
- **Auto-publish**: Publishes READY posts to homepage (every 1 minute)
- **Auto-fetch**: Fetches new posts from Reddit campaigns (every 30 minutes)

## Initial Setup

### 1. Initialize Database Settings
Run this script once to create the required settings in the database:

```bash
cd /home/ubuntu/apps/yapgrid/site
node scripts/init-job-settings.js
```

### 2. Deploy with PM2
The `ecosystem.config.js` now includes both the Next.js app and the background scheduler.

```bash
cd /home/ubuntu/apps/yapgrid/site
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### 3. Verify Jobs are Running
Check PM2 status:

```bash
pm2 status
```

You should see:
- yapgrid-nextjs (online)
- background-scheduler (online)

Check logs:

```bash
pm2 logs background-scheduler
```

## Job Control

All jobs are controlled via the admin panel at `https://yapgrid.com/admin/jobs`

### Enable/Disable Jobs
Jobs are enabled by default. To disable a job:

1. Go to admin panel
2. Click "Stop" on the desired job
3. This updates the database setting (e.g., `auto_processing_enabled = 'false'`)

### Manual Trigger
You can manually trigger any job from the admin panel by clicking the "Start" button when the job is stopped, or by using the API endpoints.

## Troubleshooting

### Jobs Not Running
Check if settings are enabled:

```bash
cd /home/ubuntu/apps/yapgrid/site
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.setting.findMany({where:{key:{in:['auto_processing_enabled','auto_posting_enabled','auto_ingest_enabled']}}}).then(console.log).finally(()=>p.\$disconnect())"
```

### Scheduler Not Starting
Check logs:

```bash
pm2 logs background-scheduler --lines 100
```

Restart scheduler:

```bash
pm2 restart background-scheduler
```

### High CPU Usage
If auto-processing is causing high CPU usage, reduce the batch size:

```sql
UPDATE Setting SET value = '5' WHERE key = 'auto_processing_batch_size';
```

## Configuration

Job settings are stored in the `Setting` table:

| Key | Default | Description |
|-----|---------|-------------|
| auto_processing_enabled | true | Enable/disable auto-processing |
| auto_processing_delay_seconds | 10 | Delay between processing posts |
| auto_processing_batch_size | 10 | Number of posts to process per run |
| auto_posting_enabled | true | Enable/disable auto-publishing |
| auto_posting_interval_minutes | 30 | Interval for publishing posts |
| auto_posting_batch_size | 5 | Number of posts to publish per run |
| auto_ingest_enabled | true | Enable/disable auto-fetching |
