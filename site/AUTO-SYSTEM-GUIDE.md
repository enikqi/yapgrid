# Auto System - Comprehensive Guide

## Overview
The auto system consists of three main components that work together to automatically fetch, process, and publish Reddit content to Pinterest.

## Components

### 1. Auto-Fetch
**Purpose**: Fetches new posts from Reddit campaigns

**How it works**:
- Cycles through enabled campaigns
- Fetches 3 posts at a time per campaign
- Saves posts with status `NEW`
- Updates `lastRun` timestamp

**Script**: `smart-auto-fetch.js`
```bash
node smart-auto-fetch.js
```

### 2. Auto-Process
**Purpose**: Processes NEW posts, downloads media, and marks them as READY

**How it works**:
- Finds posts with status `NEW`
- Downloads media using MediaDownloader
- Creates asset records in database
- Updates post status to `READY` (only if media downloaded successfully)
- If media download fails, marks post as `FAILED`
- Sets `scheduledPublishAt` time

**API**: `/api/posts/process`
```bash
curl -X POST http://localhost:3002/api/posts/process \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 2}'
```

### 3. Auto-Publish
**Purpose**: Publishes READY posts to Pinterest

**How it works**:
- Finds posts with status `READY`
- Only publishes posts that have assets
- Creates pins on Pinterest
- Updates post status to `PUBLISHED`
- Sets `publishedAt` timestamp

**API**: `/api/auto-publish`
```bash
curl -X POST http://localhost:3002/api/auto-publish \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 2}'
```

## Integrated System

**Script**: `multi-campaign-system.js`

This script runs all three components in a continuous loop, rotating through all campaigns:

```bash
node multi-campaign-system.js
```

**Cycle (every 45 seconds)**:
1. Fetch 2 new posts from rotating campaigns (cycles through all 11 campaigns)
2. Process 3 NEW posts → READY
3. Publish 2 READY posts → PUBLISHED

## Key Improvements Made

### 1. Redis Error Fixed
- Made `REDIS_URL` optional in config
- Queue system now gracefully handles missing Redis
- No more connection errors

### 2. Processing Logic Fixed
- Posts are only marked as `READY` if media is successfully downloaded
- If media download fails, post is marked as `FAILED`
- No more READY posts without assets

### 3. Multi-Campaign Support
- Rotates through all 11 enabled campaigns
- Fetches from different subreddits each cycle
- Avoids duplicate posts by checking existing redditId
- Supports adding new campaigns automatically

## Configuration

### Auto-Processing Settings
Configure via Admin Dashboard or database:
- `auto_processing_enabled`: true/false
- `auto_processing_delay_seconds`: 10
- `auto_processing_batch_size`: 3

### Auto-Publishing Settings
Configure via Admin Dashboard or database:
- `auto_publishing_enabled`: true/false
- `auto_publish_interval_minutes`: 1
- `auto_publish_batch_size`: 3

## Monitoring

### Check Status
```bash
node check-status.js
```

Output:
- Post counts by status
- Auto-posting settings
- Ready posts with assets

### Check Logs
The Next.js server logs show:
- Media downloads
- Processing status
- Publishing results
- Any errors

## Troubleshooting

### Posts stuck in NEW
- Check if MediaDownloader is working
- Check Reddit session is valid
- Check media directory permissions

### Posts in READY without assets
- Run the fix script to move them back to NEW
- Check processing logs for download errors

### Publishing not working
- Verify Pinterest credentials
- Check that posts have assets
- Verify posts have `scheduledPublishAt` in the past

## Post Status Flow

```
NEW (fetched from Reddit)
  ↓
[Auto-Process: Download media]
  ↓
READY (has assets, ready to publish)
  ↓
[Auto-Publish: Upload to Pinterest]
  ↓
PUBLISHED (live on Pinterest)
```

If media download fails:
```
NEW → FAILED
```

## Running in Production

Use PM2 to keep the system running:

```bash
# Start the multi-campaign system
pm2 start multi-campaign-system.js --name "multi-campaign-system"

# Monitor
pm2 logs multi-campaign-system

# Restart
pm2 restart multi-campaign-system

# Stop
pm2 stop multi-campaign-system
```

## Summary

✅ Auto-Fetch: Working (rotates through all 11 campaigns)
✅ Auto-Process: Working (fixed to require assets)
✅ Auto-Publish: Working
✅ Redis: Disabled (no errors)
✅ All READY posts have assets
✅ Multi-campaign support
✅ System runs continuously

The system is now fully functional, self-sustaining, and supports all campaigns!
