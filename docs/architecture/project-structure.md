# Project Structure

## Overview

This document provides a comprehensive guide to the file and directory structure of the Kukla Integration Service, an Adobe App Builder application for Commerce integration.

## Root Directory Structure

```text
kukla-integration-service/
├── 📄 Package & Config Files
│   ├── package.json                 # Dependencies and npm scripts
│   ├── package-lock.json           # Dependency lock file
│   ├── app.config.yaml             # Adobe App Builder configuration
│   ├── .env                        # Environment variables (local)
│   ├── .aio                        # Adobe I/O CLI configuration
│   └── jest.setup.js               # Jest testing configuration
│
├── 🔧 Development Tools
│   ├── .cursorrules                # AI assistant rules and patterns
│   ├── .eslintrc.json             # ESLint configuration
│   ├── .prettierrc.json           # Prettier configuration
│   ├── .prettierignore            # Prettier ignore patterns
│   ├── .markdownlint.json         # Markdown linting rules
│   ├── .gitignore                 # Git ignore patterns
│   ├── .gitattributes             # Git attributes
│   ├── .gitmessage                # Git commit message template
│   └── .vscode/                   # VS Code workspace settings
│
├── 🐙 Git Hooks
│   └── .husky/                    # Husky git hooks for code quality
│       └── pre-commit             # Pre-commit linting and formatting
│
├── 🌐 API Mesh Integration
│   ├── mesh.json                  # API Mesh configuration
│   └── mesh-resolvers.js          # Custom GraphQL resolvers (True Mesh)
│
├── ⚙️ Actions (Adobe I/O Runtime)
│   ├── backend/                   # Backend serverless functions
│   └── frontend/                  # Frontend HTMX response handlers
│
├── 🛠️ Source Code
│   └── src/                       # Shared utilities and core logic
│
├── 🌍 Frontend Assets
│   └── web-src/                   # Static frontend assets and source
│
├── 📋 Configuration System
│   └── config/                    # Environment and schema configurations
│
├── 🔧 Build & Deployment
│   ├── scripts/                   # Build and utility scripts
│   ├── dist/                      # Build output (gitignored)
│   └── .parcel-cache/             # Parcel build cache (gitignored)
│
├── 📚 Documentation
│   └── docs/                      # Comprehensive project documentation
│
└── 📦 Dependencies
    └── node_modules/              # NPM dependencies (gitignored)
```

## Actions Directory (`actions/`)

Adobe I/O Runtime serverless functions following the DRY principle and step function patterns.

```text
actions/
├── backend/                       # API endpoints and data processing
│   ├── get-products/             # Product export via REST API
│   │   ├── index.js              # Main action function
│   │   └── steps/                # Reusable step functions
│   │       ├── buildProducts.js  # Product data transformation
│   │       ├── createCsv.js      # CSV generation
│   │       ├── fetchAndEnrichProducts.js  # Data fetching
│   │       ├── storeCsv.js       # File storage
│   │       └── validateInput.js  # Input validation
│   │
│   ├── get-products-mesh/        # Product export via API Mesh (True Mesh)
│   │   ├── index.js              # Main action (reuses get-products steps)
│   │   └── steps/                # Mesh-specific steps
│   │       └── fetchProductsFromMesh.js  # GraphQL mesh query
│   │
│   ├── download-file/            # File download functionality
│   │   └── index.js              # Download action
│   │
│   └── delete-file/              # File deletion functionality
│       └── index.js              # Delete action
│
└── frontend/                     # HTMX response handlers
    ├── browse-files/             # File browser UI
    │   └── index.js              # File listing with HTMX responses
    │
    └── upload-file/              # File upload UI
        └── index.js              # Upload handling with progress
```

### Action Architecture Patterns

- **Step Functions**: Reusable functions in `/steps/` directories
- **DRY Principle**: Shared steps between similar actions (`buildProducts`, `createCsv`, `storeCsv`)
- **True Mesh**: API Mesh actions use embedded resolvers to consolidate Commerce APIs
- **Response Structure**: Consistent response format with steps, storage, and download URLs

## Source Code (`src/`)

Shared utilities and core business logic used across actions.

```text
src/
├── core/                         # Core utilities and shared functionality
│   ├── config/                   # Configuration management
│   │   ├── index.js              # Main config loader with validation
│   │   ├── base.js               # Base configuration structure
│   │   ├── environment.js        # Environment detection utilities
│   │   └── validation.js         # Configuration validation
│   │
│   ├── http/                     # HTTP client and request handling
│   │   ├── client.js             # HTTP client with retry logic
│   │   └── response.js           # Standardized response formatting
│   │
│   ├── storage/                  # File storage abstraction
│   │   ├── index.js              # Storage provider initialization
│   │   ├── app-builder.js        # Adobe I/O Files storage
│   │   ├── s3.js                 # AWS S3 storage
│   │   └── path.js               # Storage path utilities
│   │
│   ├── url/                      # URL building and management
│   │   └── index.js              # Runtime and Commerce URL builders
│   │
│   ├── routing/                  # Re-exports for URL management
│   │   └── index.js              # Routing utilities
│   │
│   ├── tracing/                  # Performance monitoring and logging
│   │   └── index.js              # Trace context and performance metrics
│   │
│   └── utils.js                  # General utility functions
│
├── commerce/                     # Adobe Commerce API integration
│   ├── auth.js                   # Commerce authentication
│   ├── products.js               # Product data fetching
│   ├── inventory.js              # Inventory enrichment
│   └── categories.js             # Category data enrichment
│
└── htmx/                         # HTMX-specific utilities
    ├── responses.js              # HTMX response helpers
    └── attributes.js             # HTMX attribute builders
```

### Source Architecture Patterns

- **Modular Design**: Each domain has its own directory
- **Configuration System**: Environment-aware with schema validation
- **Storage Abstraction**: Provider-agnostic file operations
- **True Mesh Support**: URL management for Commerce API consolidation

## Frontend Assets (`web-src/`)

Static frontend assets with HTMX progressive enhancement.

```text
web-src/
├── index.html                    # Main application HTML
├── src/                          # Frontend source code
│   ├── js/                       # JavaScript modules
│   │   ├── core/                 # Core frontend utilities
│   │   │   ├── config/           # Frontend configuration
│   │   │   │   └── index.js      # Auto-generated config loader
│   │   │   ├── url.js            # Frontend URL management
│   │   │   └── utils.js          # Frontend utilities
│   │   │
│   │   ├── htmx/                 # HTMX configuration and setup
│   │   │   ├── setup.js          # HTMX initialization and config
│   │   │   ├── events.js         # HTMX event handlers
│   │   │   └── index.js          # HTMX module exports
│   │   │
│   │   ├── components/           # Feature-specific UI components
│   │   │   └── export-products-ui.js # Export products notifications and feedback
│   │   │
│   │   ├── ui/                   # Generic UI utilities and interactions
│   │   │   ├── components/       # Reusable UI components
│   │   │   │   ├── notifications/ # Toast notification system
│   │   │   │   ├── modal/        # Modal component
│   │   │   │   └── loading/      # Loading states and spinners
│   │   │   ├── downloads/        # File download handling
│   │   │   ├── file-browser/     # File browser interactions
│   │   │   └── index.js          # UI module exports
│   │   │
│   │   ├── main.js               # Main JavaScript entry point
│   │   └── index.js              # Module exports and initialization
│   │
│   ├── css/                      # Stylesheets
│   │   ├── main.css              # Main stylesheet
│   │   ├── components/           # Component-specific styles
│   │   │   ├── buttons.css       # Button styling
│   │   │   ├── forms.css         # Form styling
│   │   │   ├── tables.css        # Table styling
│   │   │   └── notifications.css # Notification styling
│   │   │
│   │   └── utilities/            # Utility classes
│   │       ├── spacing.css       # Margin/padding utilities
│   │       ├── colors.css        # Color system
│   │       └── layout.css        # Layout utilities
│   │
│   └── config/                   # Frontend configuration
│       └── generated/            # Auto-generated configuration files
│           └── config.js         # Generated from backend config (gitignored)
│
└── assets/                       # Static assets
    ├── icons/                    # SVG icons and graphics
    └── images/                   # Application images
```

### Frontend Architecture Patterns

- **Progressive Enhancement**: Works without JavaScript, enhanced with HTMX
- **Auto-Generated Config**: Frontend config generated from backend during build
- **Component-Based CSS**: Modular stylesheets with design system
- **HTMX First**: Dynamic updates via HTMX attributes, minimal JavaScript
- **Clear Component Separation**:
  - `components/`: Feature-specific UI logic (e.g., export-products-ui)
  - `ui/`: Generic, reusable UI utilities and components

## Configuration System (`config/`)

Environment-aware configuration with schema validation.

```text
config/
├── index.js                      # Main configuration loader
├── base.js                       # Base configuration structure
├── environments/                 # Environment-specific configurations
│   ├── staging.js                # Staging environment config
│   └── production.js             # Production environment config
│
├── defaults/                     # Default configuration values
│   ├── app.js                    # Application defaults
│   ├── commerce.js               # Commerce API defaults
│   ├── storage.js                # Storage provider defaults
│   └── performance.js            # Performance settings defaults
│
└── schema/                       # Configuration validation schemas
    ├── core.schema.js            # Core configuration validation
    └── api.schema.js             # API request/response validation
```

### Configuration Architecture

- **Environment Detection**: Automatic staging/production detection
- **Schema Validation**: Build-time validation with detailed error reporting
- **Security Boundaries**: Backend vs frontend configuration filtering
- **Trust System**: No optional chaining in business logic, trust validated config

## Build & Deployment (`scripts/`)

Build scripts and utilities for development and deployment.

```text
scripts/
├── generate-frontend.js          # Generate frontend config and URLs
├── test-action.js                # Individual action testing
├── test-api.js                   # API testing utilities
└── test-performance.js           # Performance testing
```

### Build Architecture

- **Unified Generation**: Single script generates both config and URLs
- **Environment Aware**: Detects staging vs production automatically
- **Testing Integration**: Action testing with automatic configuration
- **Performance Monitoring**: Performance testing with metrics

## API Mesh Integration

```text
mesh.json                         # API Mesh configuration
mesh-resolvers.js                 # True Mesh Pattern resolvers (auto-generated)
```

### API Mesh Architecture

- **True Mesh Pattern**: Resolvers consolidate data from multiple Commerce APIs
- **Performance**: Consolidates 200+ API calls into single GraphQL query
- **Perfect Parity**: Identical CSV output from REST and mesh methods
- **Template Literal Workaround**: String concatenation for compatibility

## Documentation (`docs/`)

Comprehensive project documentation organized by purpose.

```text
docs/
├── README.md                     # Documentation navigation hub
├── getting-started/              # New developer onboarding
│   ├── overview.md               # Project overview and architecture
│   └── setup.md                  # Development environment setup
│
├── development/                  # Development guides and patterns
│   ├── coding-standards.md       # Code quality and standards
│   ├── testing.md                # Testing strategies and tools
│   ├── frontend.md               # HTMX frontend development
│   ├── design-system.md          # UI design system and components
│   ├── api-mesh-integration.md   # API Mesh True Mesh pattern
│   ├── configuration.md          # Configuration system guide
│   ├── url-management.md         # URL building patterns
│   └── schemas.md                # Schema validation system
│
├── architecture/                 # Architectural patterns and decisions
│   ├── adobe-app-builder.md      # App Builder platform guide
│   ├── htmx-integration.md       # HTMX frontend architecture
│   ├── true-mesh-pattern.md    # True Mesh architecture pattern
│   ├── project-structure.md      # This document
│   └── commerce-integration.md   # Commerce API integration
│
└── deployment/                   # Deployment and infrastructure
    ├── environments.md           # Staging and production deployment
    └── configuration.md          # Environment configuration setup
```

### Documentation Architecture

- **Purpose-Driven**: Organized by what developers need to accomplish
- **Progressive Depth**: Simple starting points with detailed follow-up
- **Cross-Referenced**: Easy navigation between related topics
- **Living Documentation**: Updated with code changes

## Development Workflow Files

### Git Hooks (`.husky/`)

- **pre-commit**: Runs `lint-staged` for automatic code formatting
- **ESLint + Prettier**: JavaScript formatting and linting
- **markdownlint + Prettier**: Markdown formatting and linting
- **Automatic Application**: Fixes applied and included in commits

### VS Code Configuration (`.vscode/`)

- **Workspace Settings**: Consistent editor configuration
- **Extension Recommendations**: Suggested extensions for development
- **Debug Configuration**: Adobe I/O Runtime debugging setup

## Key Architectural Principles

### 1. **Single Source of Truth**

- Configuration: One config system for backend and frontend
- Business Logic: REST actions are source of truth, embedded resolvers consolidate multiple Commerce APIs
- Step Functions: Reusable functions prevent code duplication

### 2. **Environment Awareness**

- Automatic detection of staging vs production
- Environment-specific configuration files
- Build-time configuration generation

### 3. **Progressive Enhancement**

- HTMX for dynamic UI with JavaScript fallbacks
- Works without JavaScript, enhanced with it
- Accessible design patterns

### 4. **Developer Experience**

- Comprehensive documentation
- Automated code quality (git hooks, linting)
- Staging-first development workflow
- Clear error messages and debugging tools

### 5. **Performance Optimization**

- API Mesh consolidates 200+ Commerce calls to 1 GraphQL query
- True Mesh consolidates 200+ API calls into single GraphQL query
- Intelligent caching and compression
- Efficient file operations

This project structure supports a maintainable, scalable Adobe App Builder application with modern development practices and architectural patterns.
