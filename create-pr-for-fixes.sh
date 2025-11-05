#!/bin/bash

# Create Pull Request për Homepage Fixes
# Kjo script krijon një branch dhe PR për Sonnet 4.5 review

set -e

echo "================================================"
echo "🚀 CREATING PR FOR HOMEPAGE FIXES"
echo "================================================"
echo ""

cd /home/ubuntu/apps/yapgrid

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create branch
BRANCH_NAME="fix/homepage-scroll-and-pagination"
echo -e "${YELLOW}📝 Creating branch: ${BRANCH_NAME}${NC}"
git checkout -b $BRANCH_NAME || git checkout $BRANCH_NAME

# Push branch
echo -e "${YELLOW}📤 Pushing branch to GitHub...${NC}"
git push origin $BRANCH_NAME || git push -u origin $BRANCH_NAME

echo ""
echo -e "${GREEN}✅ Branch created and pushed!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Shkoni në GitHub:"
echo "   https://github.com/enikqi/yapgrid/pulls"
echo ""
echo "2. Klikoni 'New pull request'"
echo ""
echo "3. Zgjidhni:"
echo "   Base: main"
echo "   Compare: $BRANCH_NAME"
echo ""
echo "4. Title:"
echo "   Fix: Homepage scroll ordering, video/image display, and pagination"
echo ""
echo "5. Description - Kopjoni nga HOMEPAGE_ISSUES_FOR_SONNET.md"
echo ""
echo "6. Klikoni 'Create pull request'"
echo ""
echo "7. Hapni Sonnet 4.5 dhe përdorni prompts nga dokumenti"
echo ""
echo "8. Sonnet 4.5 do të krijojë fixes automatikisht"
echo ""
echo "9. Merge PR dhe auto-deploy! 🚀"
echo ""

