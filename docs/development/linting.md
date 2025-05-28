# Linting Guidelines

## Overview

This document outlines our project's linting rules and code style guidelines. We use ESLint for JavaScript linting and markdownlint for documentation.

## ESLint Configuration

### Installation

```bash
# Install ESLint and plugins
npm install
```

### Running Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Key Rules

#### Error Prevention

- No unused variables (`no-unused-vars`)
- Console logs limited to warn/error (`no-console`)
- No debugger statements (`no-debugger`)
- No duplicate imports (`no-duplicate-imports`)

#### Import Organization

Imports should be organized in the following order:

1. Built-in Node.js modules
2. External dependencies
3. Internal modules
4. Parent/sibling imports
5. Index imports

Example:

```javascript
// Built-in modules
import fs from 'fs';
import path from 'path';

// External dependencies
import chalk from 'chalk';
import fetch from 'node-fetch';

// Internal modules
import { httpClient } from '../../core/http';
import { validateInput } from '../../core/validation';

// Parent/sibling imports
import { transformProduct } from '../transform';
import { processFile } from './utils';
```

#### Promise Handling

- Always return values from promises
- Avoid promise nesting
- Use proper error handling with catch or return
- Follow consistent parameter naming

#### Code Style

- Semicolons required
- Single quotes for strings
- No multiple empty lines
- Trailing commas in multiline structures
- Files must end with newline

### Configuration Files

- `.eslintrc.json`: Main ESLint configuration
- `.markdownlint.json`: Markdown linting rules

## Markdown Linting

### Running Markdown Linting

```bash
# Check markdown files
npm run lint:md

# Fix auto-fixable issues
npm run lint:md:fix
```

### Key Rules

- Code blocks must specify language
- Consistent blank lines around headings
- No multiple consecutive blank lines
- Proper list indentation
- Consistent line endings

## Best Practices

1. Run linting before committing changes
2. Fix all errors and review warnings
3. Use consistent code formatting
4. Follow import organization guidelines
5. Document any necessary rule exceptions

## IDE Integration

### VS Code

1. Install ESLint extension
2. Enable format on save
3. Use workspace settings:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true
}
```

## Continuous Integration

Our CI pipeline includes:

1. ESLint checks
2. Markdown linting
3. Unit tests

All must pass before merging.
