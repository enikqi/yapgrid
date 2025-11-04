# 504 Gateway Timeout Fix - Deployment Instructions

## Problem
The YapGrid site was experiencing 504 Gateway Timeout errors from nginx. This occurred when nginx could not receive a response from the Next.js server within the configured timeout period (60 seconds).

## Root Causes
1. **Short nginx timeout settings**: The proxy timeouts were set to 60 seconds, which is insufficient for:
   - Initial page loads with heavy data fetching (posts, communities, subscriptions)
   - API endpoints performing complex database queries
   - Pages with multiple simultaneous API calls

2. **Insufficient buffer configuration**: Limited buffer sizes could cause issues with large responses

## Changes Made

### 1. nginx Configuration (`site/nginx.conf`)
Updated timeout and buffer settings:

#### Main proxy location (`/`)
- **Increased timeouts** from 60s to 120s (2 minutes):
  - `proxy_connect_timeout`: 120s
  - `proxy_send_timeout`: 120s
  - `proxy_read_timeout`: 120s
- **Added buffer settings** for large responses:
  - `proxy_buffering`: on
  - `proxy_buffer_size`: 4k
  - `proxy_buffers`: 8 4k
  - `proxy_busy_buffers_size`: 8k

#### API endpoints (`/api/`)
- Added a dedicated location block for API endpoints
- **Extended timeouts**: 180s (3 minutes) for all timeout settings
- **Larger buffer settings** for API responses:
  - `proxy_buffer_size`: 8k
  - `proxy_buffers`: 16 8k
  - `proxy_busy_buffers_size`: 16k

### 2. Next.js Configuration (`site/next.config.ts`)
Added performance optimizations:

- **Server Components External Packages**: Added `prisma`, `@prisma/client`, and `selenium-webdriver` to prevent bundling issues
- **Optimized Package Imports**: Added `lucide-react` to reduce bundle size
- **HTTP Keep-Alive**: Enabled with 60-second keep-alive for better connection management
- **Allowed Origins**: Added environment-specific allowed origins for server actions (localhost only in development)

## Deployment Steps

### 1. Backup Current Configuration
```bash
sudo cp /etc/nginx/sites-available/yapgrid /etc/nginx/sites-available/yapgrid.backup.$(date +%Y%m%d)
```

### 2. Update nginx Configuration
```bash
cd /home/ubuntu/apps/yapgrid
git pull origin main  # or your branch name
sudo cp site/nginx.conf /etc/nginx/sites-available/yapgrid
```

### 3. Test nginx Configuration
```bash
sudo nginx -t
```

If the test passes, reload nginx:
```bash
sudo systemctl reload nginx
```

### 4. Rebuild and Restart Next.js Application
```bash
cd /home/ubuntu/apps/yapgrid/site
npm run build
pm2 restart yapgrid-nextjs
```

### 5. Monitor the Application
```bash
# Watch nginx error logs
sudo tail -f /var/log/nginx/yapgrid.error.log

# Watch PM2 logs
pm2 logs yapgrid-nextjs

# Check application status
pm2 status
```

## Expected Results
- ✅ No more 504 Gateway Timeout errors on page loads (up to 2 minutes allowed)
- ✅ API endpoints can take up to 3 minutes to respond (though they should be much faster)
- ✅ Better handling of large responses with improved buffering
- ✅ Improved connection management between nginx and Next.js
- ✅ Environment-specific security with conditional allowed origins

## Rollback Plan
If issues occur after deployment:

```bash
# Restore previous nginx config
sudo cp /etc/nginx/sites-available/yapgrid.backup.YYYYMMDD /etc/nginx/sites-available/yapgrid
sudo nginx -t
sudo systemctl reload nginx

# Revert Next.js changes
cd /home/ubuntu/apps/yapgrid
git checkout main  # or previous working branch
cd site
npm run build
pm2 restart yapgrid-nextjs
```

## Additional Performance Recommendations

### For future optimization:
1. **Add caching** for frequently accessed API endpoints
2. **Implement pagination** with smaller page sizes (current: 15 items)
3. **Add database indexes** on frequently queried fields
4. **Consider Redis caching** for API responses
5. **Add rate limiting** to prevent abuse
6. **Implement API route segments** for better caching strategies
7. **Use incremental static regeneration (ISR)** for semi-static pages

## Testing Checklist
- [ ] Homepage loads without timeout
- [ ] API endpoints respond within timeout
- [ ] Search functionality works
- [ ] Post filtering works (popular, videos, images, etc.)
- [ ] Community pages load correctly
- [ ] Admin panel is accessible
- [ ] nginx logs show no timeout errors
- [ ] PM2 shows application is running stable
