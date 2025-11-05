#!/bin/bash

# Sync GitHub Changes to Server
# Kjo script merr ndryshimet nga GitHub dhe i aplikon në server

set -e

echo "================================================"
echo "🔄 SYNC GITHUB TO SERVER"
echo "================================================"
echo ""

cd /home/ubuntu/apps/yapgrid

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Merrni branch-in aktual
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${CURRENT_BRANCH}${NC}"

# Pull ndryshimet nga GitHub
echo -e "${YELLOW}⬇️  Pulling latest changes from GitHub...${NC}"
git fetch origin

# Check nëse ka ndryshime
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/$CURRENT_BRANCH)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo -e "${GREEN}✅ Server is up to date with GitHub${NC}"
    exit 0
fi

echo -e "${YELLOW}📥 New changes detected!${NC}"
echo -e "${BLUE}Local:  ${LOCAL_COMMIT:0:7}${NC}"
echo -e "${BLUE}Remote: ${REMOTE_COMMIT:0:7}${NC}"

# Shfaq ndryshimet
echo ""
echo -e "${YELLOW}📋 Changes to be applied:${NC}"
git log --oneline $LOCAL_COMMIT..origin/$CURRENT_BRANCH || echo "No commits to show"

# Pull ndryshimet
echo ""
echo -e "${YELLOW}⬇️  Applying changes...${NC}"
git pull origin $CURRENT_BRANCH || {
    echo -e "${RED}❌ Pull failed!${NC}"
    echo -e "${YELLOW}💡 You may need to resolve conflicts manually${NC}"
    exit 1
}

# Install dependencies nëse ka ndryshime në package.json
if git diff --name-only $LOCAL_COMMIT..HEAD | grep -q "package.json\|package-lock.json"; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    cd site
    npm install
    cd ..
fi

# Build nëse ka ndryshime në kod
if git diff --name-only $LOCAL_COMMIT..HEAD | grep -E "\.(ts|tsx|js|jsx)$"; then
    echo -e "${YELLOW}🔨 Building application...${NC}"
    cd site
    npm run build || {
        echo -e "${RED}❌ Build failed!${NC}"
        echo -e "${YELLOW}💡 Review errors above and fix manually${NC}"
        exit 1
    }
    cd ..
fi

# Restart PM2
echo -e "${YELLOW}♻️  Restarting application...${NC}"
pm2 restart yapgrid-nextjs || echo -e "${YELLOW}⚠️  PM2 restart skipped (may not be running)${NC}"

echo ""
echo -e "${GREEN}================================================"
echo "✅ SYNC COMPLETE!"
echo "================================================"
echo -e "${NC}"
echo "📍 Branch: $CURRENT_BRANCH"
echo "🔗 Latest commit: $(git rev-parse --short HEAD)"
echo "🌐 Check status: pm2 status"
echo ""

