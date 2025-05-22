# Branch Strategy and Commit Guidelines

## Branch Types

### docs/current
- Source of truth for all documentation
- All documentation changes must be made here first
- Changes propagate to feature branches

### Feature Branches
- Named as `feature/<feature-name>`
- Focus on specific functionality
- Pull documentation from docs/current
- Merge into develop when complete

### Development Infrastructure
- Named as `feature/local-dev-setup`
- Focus on development environment and tooling
- Pull documentation from docs/current

## Commit Guidelines

### Commit Message Format
```
<type>: <subject>

[body]
```

### Types
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Formatting changes
- refactor: Code restructuring
- test: Test updates
- chore: Maintenance tasks

### Best Practices
1. Keep commits atomic and focused
2. Use present tense ("add feature" not "added feature")
3. Limit first line to 50 characters
4. Wrap body at 72 characters
5. Use body to explain what and why, not how

### Documentation Updates
1. Always update docs/current first
2. Use `git checkout docs/current -- docs/` to sync
3. Commit documentation updates separately
4. Use clear commit messages for doc updates

### Merging Strategy
1. Use `--no-ff` for feature merges to maintain history
2. Write descriptive merge commit messages
3. Reference related issues/tickets
4. Include testing/validation details

### Branch Cleanup
1. Delete feature branches after merge
2. Keep main branches clean
3. Regularly update from upstream
4. Resolve conflicts promptly 