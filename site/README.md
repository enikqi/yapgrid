# PinReddit

PinReddit is a full-stack application that automatically discovers Reddit videos and publishes them to Pinterest boards. Built with Next.js 14, TypeScript, and modern web technologies.

## Features

- 🎥 **Pinterest-style masonry grid** with responsive design
- 🤖 **Automated Reddit video discovery** with customizable filters
- 📌 **Pinterest API v5 integration** for automatic pin creation
- 🎬 **Video download pipeline** with yt-dlp and ffmpeg (handles Reddit's separate audio/video streams)
- 👤 **Admin dashboard** with authentication
- 📊 **Job queue management** with BullMQ and Redis
- ⏰ **Scheduled automation** with cron jobs
- 💾 **Flexible storage** (local or S3-compatible)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Queue**: BullMQ, Redis
- **Auth**: NextAuth.js
- **Media**: yt-dlp, ffmpeg
- **Deployment**: PM2, Nginx, Ubuntu

## Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- ffmpeg
- yt-dlp
- PM2 (for production)
- Nginx (for production)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pinreddit.git
   cd pinreddit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install system dependencies**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install ffmpeg redis-server postgresql

   # Install yt-dlp
   sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
   sudo chmod a+rx /usr/local/bin/yt-dlp
   ```

4. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb pinreddit

   # Run migrations
   npm run db:push
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Start Redis
   redis-server

   # Terminal 2: Start Next.js
   npm run dev

   # Terminal 3: Start worker
   npm run worker:dev
   ```

## Configuration

### Environment Variables

Key environment variables to configure:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pinreddit

# Redis
REDIS_URL=redis://localhost:6379

# Reddit API (OAuth preferred)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_REFRESH_TOKEN=your_refresh_token

# Pinterest API
PINTEREST_ACCESS_TOKEN=your_business_account_token
PINTEREST_DEFAULT_BOARD_ID=your_board_id

# Storage
STORAGE_DRIVER=local # or s3
MEDIA_DIR=./media

# NextAuth
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3002
```

### Reddit API Setup

1. Create a Reddit app at https://www.reddit.com/prefs/apps
2. Choose "script" type
3. Set redirect URI to `http://localhost:3002/api/auth/callback/reddit`
4. Use the client ID and secret in your `.env`

### Pinterest API Setup

1. Create a Pinterest business account
2. Create an app at https://developers.pinterest.com/
3. Generate an access token
4. Create a board and get its ID

## Usage

### Admin Dashboard

Access the admin dashboard at `http://localhost:3002/admin`

Features:
- **Settings**: Configure subreddits, keywords, and filters
- **Posts**: View and manage downloaded videos
- **Jobs**: Monitor queue status
- **Pinterest**: Configure boards and publishing settings
- **Reddit**: Test Reddit connection and manual import

### API Endpoints

- `GET /api/posts` - Get posts with pagination
- `POST /api/ingest/reddit` - Trigger Reddit ingest
- `GET /api/admin/settings` - Get settings (auth required)
- `POST /api/admin/settings` - Update settings (auth required)

## Production Deployment

### 1. Server Setup (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install dependencies
sudo apt install -y postgresql redis-server nginx ffmpeg git

# Install PM2 globally
sudo npm install -g pm2

# Install yt-dlp
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/pinreddit.git /home/ubuntu/pinreddit
cd /home/ubuntu/pinreddit

# Install dependencies
npm install

# Copy and configure environment
cp env.example .env
nano .env # Edit with production values

# Build application
npm run build

# Run database migrations
npm run db:push

# Create directories
mkdir -p logs media temp
chmod -R 755 media temp logs
```

### 3. PM2 Setup

```bash
# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### 4. Nginx Setup

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/pinreddit
sudo ln -s /etc/nginx/sites-available/pinreddit /etc/nginx/sites-enabled/

# Edit server_name in the config
sudo nano /etc/nginx/sites-available/pinreddit

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Setup (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pinreddit.example.com
```

### 6. Deployment Script

Use the provided deployment script for updates:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Monitoring

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs pinreddit-web
pm2 logs pinreddit-worker

# Monitor resources
pm2 monit
```

### Application Logs

Logs are stored in the `logs/` directory:
- `web-*.log` - Next.js application logs
- `worker-*.log` - Background worker logs

## Troubleshooting

### Common Issues

1. **Video download fails**
   - Ensure yt-dlp is installed and updated: `yt-dlp -U`
   - Check ffmpeg installation: `ffmpeg -version`
   - Verify temp directory permissions

2. **Pinterest upload fails**
   - Verify access token is valid
   - Check video meets Pinterest requirements (aspect ratio, duration, size)
   - Ensure board ID is correct

3. **Redis connection errors**
   - Check Redis is running: `redis-cli ping`
   - Verify REDIS_URL in .env

4. **Database connection errors**
   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify DATABASE_URL in .env
   - Ensure database exists

## Pinterest Video Requirements

- **Formats**: MP4, MOV
- **Duration**: 4 seconds to 15 minutes
- **File size**: Up to 2GB (recommend under 1GB)
- **Aspect ratios**: 1:1, 2:3, 9:16 (vertical preferred)
- **Resolution**: At least 240x240 pixels

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please create an issue on GitHub.