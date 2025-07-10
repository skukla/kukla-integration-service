# Scripts Architecture

## Overview

The scripts directory follows **Domain-Driven Design (DDD)** principles with a clear separation between shared infrastructure domains and business domains.

## Architecture Pattern

```bash
scripts/
├── core/           # Shared infrastructure (environment, hash, script framework)
├── format/         # Shared infrastructure (formatting, display, messaging)
├── build/          # Business domain (build processes)
├── deploy/         # Business domain (deployment processes)
└── test/           # Business domain (testing processes)
```

### Shared Infrastructure Domains

**Shared infrastructure domains** provide reusable utilities and operations used across multiple business domains:

#### Core Domain (`scripts/core/`)

- **Purpose**: Environment detection, script framework, hash operations
- **Usage**: Used by all business domains for basic infrastructure
- **Contents**: Environment detection, script execution framework, file operations

#### Format Domain (`scripts/format/`)

- **Purpose**: Consistent formatting, display, and messaging across all scripts
- **Usage**: Used by all business domains for output formatting
- **Contents**: Message templates, display formatting, script lifecycle formatting

### Business Domains

**Business domains** focus on specific business processes and workflows:

#### Build Domain (`scripts/build/`)

- **Purpose**: Build processes and artifact generation
- **Workflows**: App building, frontend generation, mesh generation

#### Deploy Domain (`scripts/deploy/`)

- **Purpose**: Deployment processes and environment management
- **Workflows**: App deployment, mesh deployment

#### Test Domain (`scripts/test/`)

- **Purpose**: Testing processes and validation
- **Workflows**: Action testing, API testing, performance testing

## Domain Structure

Each domain follows the same DDD hierarchy:

```bash
domain/
├── workflows/      # High-level orchestration (business logic)
├── operations/     # Mid-level processes (domain operations)
└── utils/          # Low-level utilities (pure functions)
```

### Workflows Layer

- **Purpose**: High-level business orchestration
- **Characteristics**: Combines multiple operations, handles complex business logic
- **Example**: `appDeploymentWorkflow()` orchestrates build → deploy → mesh update

### Operations Layer

- **Purpose**: Mid-level domain-specific operations
- **Characteristics**: Focused business operations, reusable across workflows
- **Example**: `buildProcessStep()` handles the build process logic

### Utils Layer

- **Purpose**: Low-level pure functions and constants
- **Characteristics**: No business logic, highly reusable, stateless
- **Example**: `calculateFileHash()` or `ICONS` constants

## Format Domain Architecture

The format domain eliminates formatting pollution across business domains:

### Before Format Domain

```bash
scripts/
├── core/operations/formatting.js          # Mixed concerns
├── build/operations/output-templates.js   # Duplicate formatting
├── deploy/operations/output-templates.js  # Duplicate formatting
└── test/operations/display-formatting.js  # Duplicate formatting
```

### After Format Domain

```bash
scripts/
├── format/                    # Centralized formatting
│   ├── workflows/            # Complex formatting scenarios
│   │   └── script-lifecycle.js
│   ├── operations/           # Formatting operations
│   │   ├── messages.js
│   │   └── templates.js
│   └── utils/                # Basic formatting utilities
│       ├── constants.js
│       └── basic-formatters.js
├── build/                    # Clean business domain
├── deploy/                   # Clean business domain
└── test/                     # Clean business domain
```

### Format Domain Benefits

1. **Single Responsibility**: Each domain focuses on its core business logic
2. **Centralized Formatting**: All formatting concerns in one place
3. **Reusable Patterns**: Format workflows shared across all domains
4. **Clean Dependencies**: Business domains depend on format domain, not each other
5. **Easier Maintenance**: One place to update formatting standards

## Domain Dependencies

```bash
┌─────────────────────────────────────────┐
│              Business Domains           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  build  │ │ deploy  │ │  test   │   │
│  └─────────┘ └─────────┘ └─────────┘   │
└─────────────────┬───────────────────────┘
                  │ depends on
┌─────────────────▼───────────────────────┐
│           Shared Infrastructure         │
│  ┌─────────┐           ┌─────────┐     │
│  │  core   │           │ format  │     │
│  └─────────┘           └─────────┘     │
└─────────────────────────────────────────┘
```

**Dependency Rules:**

- Business domains can depend on shared infrastructure domains
- Business domains should NOT depend on other business domains
- Shared infrastructure domains can depend on each other (with care)
- No circular dependencies allowed

## Usage Patterns

### Using Format Domain

**SIMPLE RULE: All format functions return strings. Always use `console.log()` to print.**

```javascript
// Import the format domain
const format = require('../format');

// Basic formatting - ALL RETURN STRINGS
console.log(format.success('Operation completed'));
console.log(format.error('Operation failed'));
console.log(format.warning('Warning message'));
console.log(format.info('Information'));

// Section formatting - RETURNS STRINGS
console.log(format.section('Deploying App Builder'));
console.log(format.header('Processing Files'));

// Lifecycle formatting - RETURNS STRINGS
console.log(await format.buildStart());
console.log(await format.buildDone());
console.log(await format.deployStart(environment));
console.log(await format.deployDone(environment));

// Mesh formatting - RETURNS STRINGS
console.log(await format.meshStart(environment));
console.log(await format.meshDone(environment));
console.log(format.meshUpdateStart());
console.log(format.meshPollingStart(pollInterval, maxChecks));

// Common operations - RETURNS STRINGS
console.log(format.verbose('Processing step 1...'));
console.log(format.step('Environment validated'));
```

**Why This Pattern:**

- Zero cognitive load (same pattern everywhere)
- Pure functions (easy to test and compose)
- Industry standard (how most logging libraries work)
- Flexible (can redirect output, save to files, use in tests)

### Using Core Domain

```javascript
// Import the core domain
const core = require('../core');

// Use environment detection
const env = core.detectEnvironment();

// Use script framework
const result = await core.executeScript('deploy', deployFunction, args);

// Use spinner operations
const spinner = core.createSpinner('Deploying...');
core.succeedSpinner(spinner, 'Deployed successfully');
```

## Best Practices

### 1. Domain Separation

- Keep business logic in business domains
- Keep infrastructure in shared domains
- Avoid cross-domain business dependencies

### 2. Import Patterns

```javascript
// ✅ GOOD: Import from shared infrastructure
const format = require('../format');
const core = require('../core');

// ✅ GOOD: Import specific operations
const { buildProcessStep } = require('./operations');

// ❌ BAD: Import from other business domains
const { deploymentStep } = require('../deploy/operations');
```

### 3. Formatting Standards

- Always use format domain for output
- Use appropriate formatting level (utils → operations → workflows)
- Maintain consistent iconography and color usage

### 4. Error Handling

- Use format domain for error messages
- Maintain consistent error formatting
- Include proper context and actionable information

## Migration Guide

When moving formatting from business domains to format domain:

1. **Identify formatting logic** in business domains
2. **Extract to format domain** at appropriate level (utils/operations/workflows)
3. **Update imports** in business domains
4. **Remove duplicate formatting** from business domains
5. **Test functionality** to ensure no regressions

## Testing

Each domain includes its own testing:

- **Unit tests**: For utils and operations
- **Integration tests**: For workflows
- **End-to-end tests**: For complete script execution

Run tests with:

```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

## Maintenance

### Adding New Functionality

1. Determine if it's infrastructure (core/format) or business logic (build/deploy/test)
2. Place in appropriate domain and layer
3. Follow existing patterns and naming conventions
4. Update documentation and tests

### Refactoring

1. Maintain domain boundaries
2. Keep shared infrastructure generic and reusable
3. Avoid business logic in infrastructure domains
4. Update dependencies carefully to avoid breaking changes
