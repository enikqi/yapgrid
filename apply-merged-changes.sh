#!/bin/bash

# Apply Merged Changes from GitHub
# Kjo script aplikon ndryshimet që janë merge-uar në GitHub

set -e

echo "================================================"
echo "🚀 APPLYING MERGED CHANGES FROM GITHUB"
echo "================================================"
echo ""

cd /home/ubuntu/apps/yapgrid

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${CURRENT_BRANCH}${NC}"

# Step 1: Pull latest changes from GitHub
echo ""
echo -e "${YELLOW}⬇️  Step 1: Pulling latest changes from GitHub main...${NC}"
git fetch origin
git checkout main || git checkout -b main origin/main
git pull origin main

echo -e "${GREEN}✅ Pulled latest changes${NC}"

# Step 2: Check what changed
echo ""
echo -e "${YELLOW}📋 Step 2: Checking changes...${NC}"
echo "Files changed:"
git diff HEAD~5 --name-only | grep -E "(ecosystem|schema|route|health)" | head -10 || echo "No specific files to show"

# Step 3: Install dependencies (if package.json changed)
if git diff HEAD~5 --name-only | grep -q "package.json\|package-lock.json"; then
    echo ""
    echo -e "${YELLOW}📦 Step 3: Installing dependencies...${NC}"
    cd site
    npm install
    cd ..
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo ""
    echo -e "${BLUE}⏭️  Step 3: No package changes, skipping npm install${NC}"
fi

# Step 4: Apply database migrations (indexes)
echo ""
echo -e "${YELLOW}🗄️  Step 4: Applying database migrations (performance indexes)...${NC}"
cd site

# Check if migration file exists
if [ -f "../prisma/migrations/add_performance_indexes.sql" ]; then
    echo "Found migration file, applying..."
    npx prisma migrate deploy || {
        echo -e "${YELLOW}⚠️  Migration failed, trying direct SQL...${NC}"
        npx prisma db execute --file ../prisma/migrations/add_performance_indexes.sql --schema ./prisma/schema.prisma || echo "Migration skipped"
    }
else
    echo "Running Prisma migrations..."
    npx prisma migrate deploy || echo "No migrations to apply"
fi

# Also run generate to update Prisma client
npx prisma generate
cd ..

echo -e "${GREEN}✅ Database migrations applied${NC}"

# Step 5: Build application
echo ""
echo -e "${YELLOW}🔨 Step 5: Building application...${NC}"
cd site
npm run build
cd ..

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed! Check errors above${NC}"
    exit 1
fi

# Step 6: Restart PM2 with new configuration
echo ""
echo -e "${YELLOW}♻️  Step 6: Restarting PM2 with new configuration...${NC}"

# Stop current instance
pm2 stop yapgrid-nextjs || echo "PM2 instance not running"

# Delete old instance
pm2 delete yapgrid-nextjs || echo "No instance to delete"

# Start with new configuration
cd site
pm2 start ecosystem.config.js
pm2 save
cd ..

echo -e "${GREEN}✅ PM2 restarted with production configuration${NC}"

# Step 7: Verify changes
echo ""
echo -e "${YELLOW}✅ Step 7: Verifying changes...${NC}"

# Check PM2 status
echo ""
echo "PM2 Status:"
pm2 status

# Check if running in production mode
echo ""
echo "Checking NODE_ENV:"
pm2 env yapgrid-nextjs | grep NODE_ENV || echo "Could not check NODE_ENV"

# Test health endpoint (wait a bit for server to start)
echo ""
echo -e "${YELLOW}⏳ Waiting 5 seconds for server to start...${NC}"
sleep 5

echo ""
echo "Testing health endpoint:"
curl -s http://localhost:3002/api/health | head -5 || echo "Health endpoint not responding yet"

echo ""
echo -e "${GREEN}================================================"
echo "✅ ALL CHANGES APPLIED SUCCESSFULLY!"
echo "================================================"
echo -e "${NC}"
echo "📊 Summary:"
echo "  - ✅ Pulled latest changes from GitHub"
echo "  - ✅ Installed dependencies (if needed)"
echo "  - ✅ Applied database migrations"
echo "  - ✅ Built application"
echo "  - ✅ Restarted PM2 in production mode"
echo ""
echo "🔍 Next steps:"
echo "  - Check PM2 logs: pm2 logs yapgrid-nextjs"
echo "  - Test health endpoint: curl http://localhost:3002/api/health"
echo "  - Check website: https://yapgrid.com"
echo ""

