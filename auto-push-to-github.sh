#!/bin/bash

# Auto Push to GitHub Script
# Kjo script dërgon automatikisht ndryshimet në GitHub

set -e

echo "================================================"
echo "🚀 AUTO PUSH TO GITHUB"
echo "================================================"
echo ""

cd /home/ubuntu/apps/yapgrid

# Colors për output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Shikoni statusin
echo -e "${YELLOW}📊 Checking git status...${NC}"
git status --short

# Kontrolloni nëse ka ndryshime
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✅ No changes to commit${NC}"
    exit 0
fi

# Merrni branch-in aktual
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}📍 Current branch: ${CURRENT_BRANCH}${NC}"

# Pull para se të push-oni (për të shmangur konfliktet)
echo -e "${YELLOW}⬇️  Pulling latest changes...${NC}"
git pull origin $CURRENT_BRANCH || echo "⚠️  Pull failed, continuing..."

# Shtoni të gjitha ndryshimet
echo -e "${YELLOW}➕ Adding all changes...${NC}"
git add .

# Krijo commit message automatikisht
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')

Auto-committed changes from server:
- Timestamp: $TIMESTAMP
- Branch: $CURRENT_BRANCH
- Server: $(hostname)"

# Ose nëse dëshironi të vendosni mesazh manualisht:
if [ -n "$1" ]; then
    COMMIT_MSG="$1"
fi

# Commit
echo -e "${YELLOW}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG" || {
    echo -e "${RED}❌ Commit failed. Maybe no changes to commit?${NC}"
    exit 1
}

# Push
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
git push origin $CURRENT_BRANCH || {
    echo -e "${RED}❌ Push failed!${NC}"
    echo -e "${YELLOW}💡 Try manually: git push origin $CURRENT_BRANCH${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}================================================"
echo "✅ SUCCESS! Changes pushed to GitHub"
echo "================================================"
echo -e "${NC}"
echo "📍 Branch: $CURRENT_BRANCH"
echo "🔗 GitHub: https://github.com/enikqi/yapgrid/tree/$CURRENT_BRANCH"
echo ""

