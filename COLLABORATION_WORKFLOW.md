# How to Collaborate with AI Assistants (Sonnet 4.5) via GitHub

## Quick Setup

Your repository is already connected: `git@github.com:enikqi/yapgrid.git`

## Workflow Options

### Option 1: GitHub Copilot Chat (Recommended)

1. **In GitHub.com**:
   - Go to your repository
   - Open a Pull Request
   - Click "Ask Copilot" or use the chat icon
   - Select Sonnet 4.5 model
   - Ask questions like:
     - "Review this code for performance issues"
     - "Suggest optimizations for this API route"
     - "Fix the database connection problems"

2. **In VS Code/Cursor**:
   - Install GitHub Copilot extension
   - Open Copilot Chat (`Cmd/Ctrl + L`)
   - Select Sonnet 4.5 model
   - Ask for help with code

### Option 2: GitHub Codespaces

1. Open repo in Codespaces (click "Code" → "Codespaces")
2. Use built-in Copilot Chat with Sonnet 4.5
3. Make changes directly in browser
4. Commit and push from Codespaces

### Option 3: Local Development with AI

1. **Make changes locally** (with Cursor AI or other tools)
2. **Commit and push**:
   ```bash
   git checkout -b feature/your-feature
   git add .
   git commit -m "feat: your feature"
   git push origin feature/your-feature
   ```
3. **Create PR on GitHub**
4. **Use Sonnet 4.5 in PR** to review and suggest improvements

## Example: Using Sonnet 4.5 to Fix Issues

### Step 1: Create a Branch
```bash
cd /home/ubuntu/apps/yapgrid
git checkout -b fix/performance-optimization
```

### Step 2: Ask Sonnet 4.5 for Help
In GitHub Copilot Chat (Sonnet 4.5):
```
"The homepage is loading slowly. The API response takes 5+ seconds. 
Analyze the codebase and suggest optimizations for the posts API route."
```

### Step 3: Apply Suggestions
- Review Sonnet 4.5's suggestions
- Implement the changes
- Test locally

### Step 4: Commit and Push
```bash
git add .
git commit -m "perf: optimize posts API with Sonnet 4.5 suggestions"
git push origin fix/performance-optimization
```

### Step 5: Create PR and Review
- Create PR on GitHub
- Use Sonnet 4.5 in PR comments to:
  - Review code quality
  - Suggest further improvements
  - Check for edge cases

## Current Server Changes

To apply changes from GitHub to server:

```bash
cd /home/ubuntu/apps/yapgrid
git pull origin main
cd site
npm install  # if package.json changed
pm2 restart yapgrid-nextjs
```

## Best Practices

1. **Always create branches** for changes
2. **Use descriptive commit messages**
3. **Review AI suggestions** before applying
4. **Test locally** before pushing
5. **Use PRs** for code review with AI

## Next Steps

1. Current fixes are in branch: `fix/502-gateway-and-performance-improvements`
2. Push to GitHub: `git push origin fix/502-gateway-and-performance-improvements`
3. Create PR on GitHub
4. Use Sonnet 4.5 to review the PR
5. Merge after review

