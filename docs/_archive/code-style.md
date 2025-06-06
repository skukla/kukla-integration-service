# Code Style Guidelines

## Overview

This document outlines our project's code style guidelines and formatting standards. We use Prettier for automatic code formatting and ESLint for code quality enforcement.

## Code Formatting

### Prettier Configuration

We use Prettier with the following configuration:

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Key Formatting Rules

1. **Quotes**: Use single quotes for strings unless escaping is needed
2. **Indentation**: Use 4 spaces for indentation
3. **Line Length**: Maximum line length is 100 characters
4. **Semicolons**: Required at the end of statements
5. **Trailing Commas**: Used in multiline arrays and objects
6. **Arrow Functions**: Always use parentheses around parameters
7. **Line Endings**: Use LF (Unix-style) line endings

## Pre-commit Hooks

Our project uses pre-commit hooks to ensure code quality and consistent formatting. The following checks run automatically before each commit:

1. **JavaScript/JSX Files**:

   - ESLint checks and auto-fixes
   - Prettier formatting

2. **JSON/YAML/Markdown Files**:

   - Prettier formatting

3. **Markdown Files**:
   - markdownlint checks and fixes

### Running Formatting Manually

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

## Best Practices

1. **Code Organization**:

   - Group related code together
   - Use meaningful file and directory names
   - Keep files focused and single-purpose
   - Limit file size (if a file grows too large, consider splitting it)

2. **Naming Conventions**:

   - Use camelCase for variables and functions
   - Use PascalCase for classes and components
   - Use UPPER_SNAKE_CASE for constants
   - Use descriptive names that indicate purpose

3. **Comments and Documentation**:

   - Write self-documenting code where possible
   - Add comments for complex logic
   - Document public APIs and interfaces
   - Keep comments up to date with code changes

4. **Error Handling**:

   - Use try/catch blocks appropriately
   - Provide meaningful error messages
   - Log errors with proper context
   - Handle edge cases explicitly

5. **Imports**:
   - Group imports as defined in ESLint configuration
   - Remove unused imports
   - Use named imports when possible
   - Avoid default exports for better refactoring

## IDE Integration

For the best development experience, we use VS Code with automatic formatting on save. This proactively fixes formatting issues before they're caught by linters or pre-commit hooks.

### Required Extensions

1. **Prettier - Code formatter** (`esbenp.prettier-vscode`)

   - Handles automatic code formatting
   - Runs on file save
   - Configured as default formatter for JavaScript, JSON, Markdown, and YAML

2. **ESLint** (`dbaeumer.vscode-eslint`)

   - Provides real-time linting feedback
   - Auto-fixes issues on save
   - Integrates with our ESLint configuration

3. **markdownlint** (`DavidAnson.vscode-markdownlint`)
   - Markdown-specific linting
   - Auto-fixes common issues on save
   - Follows our markdownlint rules

### Workspace Settings

Our `.vscode/settings.json` configures:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.markdownlint": true
  }
}
```

This setup:

- Formats files automatically on save
- Fixes ESLint issues on save
- Fixes markdownlint issues on save
- Uses Prettier as the default formatter

### Benefits

1. **Immediate Feedback**: Issues are fixed as you work
2. **Consistency**: All files are formatted the same way
3. **Efficiency**: Reduces time spent on formatting in code reviews
4. **Prevention**: Catches issues before they reach version control

## Continuous Integration

Our formatting standards are enforced through:

1. Pre-commit hooks (local development)
2. GitHub Actions (CI/CD pipeline)
3. Pull request checks

## Questions and Updates

If you have questions about these guidelines or would like to propose changes:

1. Open a discussion in GitHub Issues
2. Propose changes through pull requests
3. Discuss with the team in our regular meetings
