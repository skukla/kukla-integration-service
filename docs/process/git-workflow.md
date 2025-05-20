# Git Workflow Strategy

This document outlines our Git branching strategy and workflow procedures for the Adobe Commerce App Builder project.

## Branch Structure

```
master
├── develop
│   ├── feature/feed-implementation
│   ├── feature/new-feature-1
│   └── feature/new-feature-2
├── docs/current
└── docs/archive
```

### Main Branches

- `master`: Source of truth, contains production-ready code
- `develop`: Integration branch for feature development

### Supporting Branches

- `feature/*`: New features and improvements
- `bugfix/*`: Bug fixes
- `release/*`: Release preparation
- `hotfix/*`: Urgent production fixes
- `docs/current`: Active documentation
- `docs/archive`: Historical documentation

## Workflow Procedures

### 1. Starting New Feature Development

```bash
# Ensure you're up to date with develop
git checkout develop
git pull origin develop

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
# Get latest changes from develop
git checkout develop
git pull origin develop

# Update your feature branch
git checkout feature/your-feature-name
git merge develop

# Resolve any conflicts if they occur
git push origin feature/your-feature-name
```

### 4. Completing a Feature

```bash
# Ensure your feature branch is up to date
git checkout feature/your-feature-name
git pull origin feature/your-feature-name

# Merge develop into your feature branch to resolve conflicts
git merge develop

# Push final changes
git push origin feature/your-feature-name

# Create a Pull Request from feature/your-feature-name to develop
# After PR approval:
git checkout develop
git merge feature/your-feature-name
git push origin develop

# Delete feature branch (optional)
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

### 5. Release Process

```bash
# Create release branch
git checkout develop
git checkout -b release/v1.x.x

# Make release preparations (version bumps, final fixes)
git commit -m "chore: prepare v1.x.x release"

# Merge to master
git checkout master
git merge release/v1.x.x
git tag v1.x.x
git push origin master --tags

# Update develop
git checkout develop
git merge master
git push origin develop

# Clean up
git branch -d release/v1.x.x
git push origin --delete release/v1.x.x
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
   - Releases: `release/v1.x.x`
   - Hotfixes: `hotfix/critical-issue`

2. **Commit Messages**
   - Write clear, descriptive commit messages
   - Use conventional commit format
   - Reference issue numbers when applicable

3. **Code Review**
   - All changes to `develop` and `master` should go through PR review
   - Keep PRs focused and reasonably sized
   - Include relevant tests and documentation

4. **Branch Maintenance**
   - Delete merged feature branches
   - Regularly update feature branches with changes from develop
   - Keep branches short-lived when possible

5. **Conflict Resolution**
   - Always resolve conflicts locally before pushing
   - When in doubt, consult team members
   - Document complex conflict resolutions in PR comments

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

# Backport to develop
git checkout develop
git merge hotfix/critical-issue
git push origin develop

# Clean up
git branch -d hotfix/critical-issue
git push origin --delete hotfix/critical-issue
```

## Questions and Support

For questions about this workflow or assistance with Git operations, consult with the team lead or senior developers. 