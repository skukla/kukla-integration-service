# Git Workflow Strategy

This document outlines our Git branching strategy and workflow procedures for the Adobe Commerce App Builder project.

## Branch Structure

```text
master
├── feature/new-feature-1
├── feature/new-feature-2
├── docs/current
└── docs/archive
```

### Main Branch

- `master`: Source of truth, contains production-ready code

### Supporting Branches

- `feature/*`: New features and improvements
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent production fixes
- `docs/current`: Active documentation
- `docs/archive`: Historical documentation

## Workflow Procedures

### 1. Starting New Feature Development

```bash
# Ensure you're up to date with master
git checkout master
git pull origin master

# Create new feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
git add .
git commit -m "feat: description of your changes"

# Push your feature branch to remote
git push origin feature/your-feature-name
```

### 2. Making Regular Commits

Follow these commit message conventions:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example:

```bash
git add specific-file.js
git commit -m "feat: implement user authentication flow"
```

### 3. Updating Your Feature Branch

```bash
# Get latest changes from master
git checkout master
git pull origin master

# Update your feature branch
git checkout feature/your-feature-name
git merge master

# Resolve any conflicts if they occur
git push origin feature/your-feature-name
```

### 4. Completing a Feature

```bash
# Ensure your feature branch is up to date
git checkout feature/your-feature-name
git pull origin feature/your-feature-name

# Merge master into your feature branch to resolve conflicts
git merge master

# Push final changes
git push origin feature/your-feature-name

# Create a Pull Request from feature/your-feature-name to master (optional)
# Or merge directly to master:
git checkout master
git merge feature/your-feature-name
git push origin master

# Delete feature branch (optional)
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

### 5. Release Process

```bash
# On master branch
git checkout master
git pull origin master

# Tag the release
git tag v1.x.x
git push origin master --tags
```

### 6. Documentation Changes

For documentation updates:
```bash
git checkout docs/current
git pull origin docs/current

# Make documentation changes
git add .
git commit -m "docs: update feature documentation"
git push origin docs/current
```

## Best Practices

1. **Branch Naming**
   - Features: `feature/descriptive-name`
   - Bug fixes: `bugfix/issue-description`
   - Hotfixes: `hotfix/critical-issue`

2. **Commit Messages**
   - Write clear, descriptive commit messages
   - Use conventional commit format
   - Reference issue numbers when applicable

3. **Code Review**
   - Consider using Pull Requests for significant changes
   - Keep changes focused and reasonably sized
   - Include relevant tests and documentation

4. **Branch Maintenance**
   - Delete merged feature branches
   - Keep branches short-lived when possible
   - Consider squashing commits for cleaner history

5. **Conflict Resolution**
   - Always resolve conflicts locally before pushing
   - When in doubt, consult team members
   - Document complex conflict resolutions

## Emergency Hotfix Procedure

For critical production issues:

```bash
# Create hotfix branch from master
git checkout master
git checkout -b hotfix/critical-issue

# Make fixes
git commit -m "fix: resolve critical issue"

# Merge to master
git checkout master
git merge hotfix/critical-issue
git tag v1.x.x-hotfix.1
git push origin master --tags

# Clean up
git branch -d hotfix/critical-issue
git push origin --delete hotfix/critical-issue
```

## Questions and Support

For questions about this workflow or assistance with Git operations, consult with the team lead or senior developers. 