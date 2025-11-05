#!/bin/bash

# Setup Auto Sync Script
# Kjo script konfiguron automatik sync midis serverit dhe GitHub

echo "================================================"
echo "⚙️  SETUP AUTO SYNC: SERVER ↔ GITHUB"
echo "================================================"
echo ""

cd /home/ubuntu/apps/yapgrid

# Make scripts executable
chmod +x auto-push-to-github.sh
chmod +x sync-github-to-server.sh
chmod +x watch-and-auto-push.sh

echo "✅ Scripts made executable"
echo ""

# Setup cron job për auto-sync
echo "📅 Setting up cron jobs..."
echo ""

# Backup existing crontab
crontab -l > /tmp/crontab-backup-$(date +%s).txt 2>/dev/null || echo "No existing crontab"

# Add new cron jobs
(crontab -l 2>/dev/null; echo "") | crontab - 2>/dev/null || true

# Cron job 1: Sync nga GitHub në server (çdo 30 minuta)
(crontab -l 2>/dev/null; echo "# Auto sync from GitHub to server (every 30 minutes)"; echo "*/30 * * * * cd /home/ubuntu/apps/yapgrid && ./sync-github-to-server.sh >> /tmp/github-sync.log 2>&1") | crontab -

# Cron job 2: Auto push nga server në GitHub (çdo orë) - vetëm nëse ka ndryshime
(crontab -l 2>/dev/null; echo "# Auto push from server to GitHub (hourly, only if changes exist)"; echo "0 * * * * cd /home/ubuntu/apps/yapgrid && git status --porcelain | grep -q . && ./auto-push-to-github.sh 'Auto-commit: $(date +%Y-%m-%d\ %H:%M:%S)' >> /tmp/github-push.log 2>&1 || true") | crontab -

echo "✅ Cron jobs added:"
echo ""
crontab -l | tail -2
echo ""

echo "================================================"
echo "✅ SETUP COMPLETE!"
echo "================================================"
echo ""
echo "📋 Cron Jobs:"
echo "  - Sync from GitHub: Every 30 minutes"
echo "  - Auto push to GitHub: Every hour (if changes exist)"
echo ""
echo "📊 Logs:"
echo "  - Sync: /tmp/github-sync.log"
echo "  - Push: /tmp/github-push.log"
echo ""
echo "🔧 Manual Commands:"
echo "  - Push to GitHub: ./auto-push-to-github.sh"
echo "  - Sync from GitHub: ./sync-github-to-server.sh"
echo ""
echo "📚 Documentation:"
echo "  - SONNET_4.5_COLLABORATION_GUIDE.md"
echo "  - QUICK_START_SONNET.md"
echo ""
echo "🎉 Setup complete! Auto sync is now active."
echo ""

