# GitHub Collaboration Guide with AI Assistants (Sonnet 4.5)

This guide explains how to collaborate on this project using GitHub with AI assistants like Claude Sonnet 4.5 (via GitHub Copilot Chat or similar).

## Repository Information

- **Repository**: `git@github.com:enikqi/yapgrid.git`
- **Default Branch**: `main`

## Quick Start Workflow

### 1. Making Changes Locally (Server)

```bash
cd /home/ubuntu/apps/yapgrid

# Check current status
git status

# Create a new branch for your changes
git checkout -b fix/issue-description

# Make your changes, then commit
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin fix/issue-description
```

### 2. Using Sonnet 4.5 / GitHub Copilot Chat

#### Option A: GitHub Copilot Chat in VS Code/Cursor
1. Open the repository in VS Code/Cursor
2. Use the Copilot Chat panel (usually `Cmd/Ctrl + L`)
3. Ask Sonnet 4.5 to:
   - Review code
   - Suggest improvements
   - Fix bugs
   - Add features
   - Write tests

#### Option B: GitHub.com Pull Request Reviews
1. Create a Pull Request on GitHub
2. Use GitHub Copilot Chat in the PR:
   - Click "Ask Copilot" in the PR
   - Ask Sonnet 4.5 to review the changes
   - Get suggestions for improvements

#### Option C: GitHub Codespaces
1. Open the repo in GitHub Codespaces
2. Use the built-in Copilot Chat with Sonnet 4.5
3. Make changes directly in the browser

### 3. Collaboration Workflow

#### When working with AI assistants:

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes with AI assistance**:
   - Use Sonnet 4.5 to help write code
   - Review AI suggestions before committing
   - Test changes locally

3. **Commit with descriptive messages**:
   ```bash
   git commit -m "feat: add new feature with AI assistance"
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

5. **Review with AI**:
   - Use Sonnet 4.5 in PR comments to review
   - Ask for code improvements
   - Get suggestions for optimization

6. **Merge after approval**:
   - Merge PR to `main`
   - Pull latest on server:
     ```bash
     git checkout main
     git pull origin main
     ```

## Best Practices

### Commit Message Format
- `fix:` - Bug fixes
- `feat:` - New features
- `perf:` - Performance improvements
- `refactor:` - Code refactoring
- `docs:` - Documentation changes

### Branch Naming
- `fix/` - Bug fixes
- `feat/` - New features
- `perf/` - Performance improvements
- `refactor/` - Code refactoring

### Using AI Effectively
1. **Be specific**: Give clear context about what you want
2. **Review AI suggestions**: Always review AI-generated code
3. **Test changes**: Test AI-suggested code before committing
4. **Ask for explanations**: Have AI explain complex changes
5. **Iterate**: Use AI feedback to improve code

## Example: Fixing an Issue with AI

```bash
# 1. Create branch
git checkout -b fix/slow-page-load

# 2. In GitHub Copilot Chat (Sonnet 4.5), ask:
# "The homepage is loading slowly. Analyze the code and suggest optimizations."

# 3. Apply AI suggestions

# 4. Test locally
npm run dev

# 5. Commit
git add .
git commit -m "perf: optimize homepage loading with AI suggestions"

# 6. Push and create PR
git push origin fix/slow-page-load
```

## Current Server Setup

The server automatically pulls from `main` branch. To deploy changes:

1. Merge PR to `main` on GitHub
2. On server, run:
   ```bash
   cd /home/ubuntu/apps/yapgrid
   git pull origin main
   pm2 restart yapgrid-nextjs
   ```

## Troubleshooting

### If changes conflict:
```bash
git fetch origin
git rebase origin/main
# Resolve conflicts, then:
git add .
git rebase --continue
```

### If you need to undo changes:
```bash
git checkout -- <file>  # Discard local changes
git reset HEAD~1         # Undo last commit
```

## Integration with Cursor AI

Since you're using Cursor with AI assistance:

1. **Make changes in Cursor** with AI help
2. **Commit locally**:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
3. **Push to GitHub**:
   ```bash
   git push origin your-branch
   ```
4. **Use GitHub Copilot Chat** (Sonnet 4.5) to review in PR
5. **Merge and deploy**

## Next Steps

1. Commit current fixes to a new branch
2. Create a PR for review
3. Use Sonnet 4.5 in GitHub to review and suggest improvements
4. Merge and deploy

---

**Note**: Always test changes locally before pushing to production!

