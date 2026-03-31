# Git Commands Guide for Pawin PyPOS

This guide documents all Git commands needed to manage this project.

---

## Initial Setup (Already Done)

```bash
# 1. Navigate to project directory
cd C:/Users/PAWIN\ PLC/Documents/PyPOS

# 2. Initialize git repository
git init

# 3. Add remote repository
git remote add origin https://github.com/pawinplc/Pawin-PyPOS.git

# 4. Create .gitignore
# (already created with node_modules, dist, .env, etc.)

# 5. Add all files
git add .

# 6. Create initial commit
git commit -m "Initial commit: Pawin PyPOS - University Stationery Inventory & POS System"

# 7. Create master branch (if needed)
git branch -M master
```

---

## Push to GitHub (First Time)

```bash
# Set upstream and push
git push -u origin master
```

**If prompted for credentials:**
- Username: your GitHub username
- Password: your GitHub Personal Access Token (NOT your password)
  - Generate at: https://github.com/settings/tokens
  - Select scope: `repo`

---

## Daily Workflow Commands

### Check Status
```bash
git status
```

### See Changes
```bash
# See unstaged changes
git diff

# See staged changes
git diff --staged

# See all changes from last commit
git diff HEAD~1
```

### Stage Files
```bash
# Stage all changed files
git add .

# Stage specific file
git add src/pages/Dashboard.jsx

# Stage all files in a directory
git add src/

# Remove file from staging
git restore --staged filename.jsx
```

### Commit Changes
```bash
# Commit with message
git commit -m "Add dark mode toggle feature"

# Commit all tracked files (skip git add)
git commit -am "Fix stock calculation bug"

# Amend last commit (ONLY if not pushed!)
git commit --amend -m "Updated commit message"
```

### Push Changes
```bash
# Push to remote
git push

# Push to specific branch
git push origin master

# Push with force (USE CAREFULLY!)
git push --force origin master
```

---

## Branch Commands

### Create & Switch Branches
```bash
# Create new branch
git branch feature-name

# Switch to branch
git checkout feature-name

# Create and switch (shortcut)
git checkout -b feature-name

# Switch back to master
git checkout master
```

### Merge Branches
```bash
# Switch to master
git checkout master

# Merge feature branch
git merge feature-name

# Delete merged branch
git branch -d feature-name
```

### Push Branch
```bash
# Push new branch
git push -u origin feature-name

# Push all branches
git push --all origin
```

---

## Working with Remote

### Update Remote URL
```bash
# Check current remote
git remote -v

# Update remote URL
git remote set-url origin https://github.com/pawinplc/Pawin-PyPOS.git
```

### Fetch & Pull
```bash
# Fetch updates from remote
git fetch origin

# Pull changes (fetch + merge)
git pull origin master

# Pull with rebase
git pull --rebase origin master
```

---

## Useful Commands

### View History
```bash
# View commit history
git log

# View in one line
git log --oneline

# View last 5 commits
git log -5

# View commit history with graph
git log --graph --oneline --all
```

### Undo Changes
```bash
# Discard local changes to file
git restore filename.jsx

# Discard all local changes
git restore .

# Uncommit last commit (keep changes staged)
git reset --soft HEAD~1

# Uncommit and unstage
git reset HEAD~1

# Uncommit and delete changes (BE CAREFUL!)
git reset --hard HEAD~1
```

### Clean Up
```bash
# Remove untracked files (dry run)
git clean -n

# Remove untracked files
git clean -f

# Remove untracked directories
git clean -fd
```

---

## Current Project Status

| Item | Status |
|------|--------|
| Repository | Initialized |
| Remote | https://github.com/pawinplc/Pawin-PyPOS.git |
| Branch | master |
| Commits | 1 (Initial commit) |
| Unpushed | 0 |
| Uncommitted Changes | Run `git status` to check |

---

## Quick Reference - Push Your Changes

```bash
# 1. Go to project folder
cd C:/Users/PAWIN\ PLC/Documents/PyPOS

# 2. Check what changed
git status

# 3. Stage all changes
git add .

# 4. Commit with message
git commit -m "Your commit message here"

# 5. Push to GitHub
git push -u origin master

# 6. Enter credentials when prompted
```

---

## Troubleshooting

### GitHub Authentication Issues
```bash
# Use Personal Access Token instead of password
# Generate at: https://github.com/settings/tokens

# Or use SSH (configure once)
# 1. Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. Add key to GitHub
# Settings > SSH and GPG keys > New SSH key

# 3. Change remote URL to SSH
git remote set-url origin git@github.com:pawinplc/Pawin-PyPOS.git

# 4. Push
git push -u origin master
```

### SSL Certificate Issues
```bash
git config --global http.sslVerify false
```

### Large File Warning
```bash
# Install Git LFS for large files
git lfs install
git lfs track "*.psd" "*.zip" "*.png"
git add .gitattributes
```
