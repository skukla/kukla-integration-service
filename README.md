# Kukla Integration Service

## ✅ REFACTORING COMPLETED (refactor/simplify branch)

**This branch has successfully migrated from over-engineered patterns to Adobe App Builder standard patterns.**

📖 **Documentation Strategy**: See [DOCUMENTATION-STRATEGY.md](DOCUMENTATION-STRATEGY.md)  
🤖 **Claude Guidance**: See [CLAUDE.md](CLAUDE.md)  
👨‍💻 **Developer Rules**: See [.cursorrules](.cursorrules)

**Achieved**: Significant code reduction while maintaining all functionality by adopting Adobe standard patterns.

---

## Overview

A streamlined Adobe App Builder application that integrates with Adobe Commerce to provide product data management and file operations through a simple, maintainable architecture.

## Quick Links

📚 [Architecture Guide](docs/architecture.md) - System design and components  
🛠️ [Development Guide](docs/development.md) - Setup and workflow  
🚀 [Development Modes](docs/development-modes.md) - Local vs Staging vs Production  
🔒 [Security Guide](docs/security.md) - Security practices  
🐛 [Debugging Guide](docs/debugging.md) - Debugging process and tools  
⚙️ [Configuration Guide](docs/configuration.md) - Configuration system

## Key Features

- **Product Management** - Export and manage Adobe Commerce product data
- **File Operations** - Secure file storage and handling
- **Simple Architecture** - Clear separation of concerns with focused components
- **HTMX Integration** - Dynamic UI updates without complex JavaScript
- **Performance Optimized** - Caching, compression, and efficient resource usage
- **Flexible Configuration** - Environment-aware settings with validation

## Getting Started

1. **Prerequisites**

- Node.js 18+
- Adobe Developer Console access
- Adobe Commerce instance
- Adobe I/O CLI

2. **Installation**

   ```bash
   git clone <repository-url>
   cd kukla-integration-service
   npm install
   ```

3. **Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

The application uses a comprehensive configuration system:

- Environment-specific settings in `config/environments/`
- Default values in `config/defaults/`
- Schema validation for all settings
- See [Configuration Guide](docs/configuration.md) for details

4. **Development**

   This App Builder application uses staging workspace for all development.

   ### Prerequisites

   1. **Adobe I/O Project**: Configure your project with proper credentials
   2. **AIO CLI**: Install and configure with your credentials
   3. **Workspace**: Set up staging workspace with Files SDK access

   ### Development Workflow

   ```bash
   # Quick development cycle
   npm run deploy             # Generates frontend assets + deploy to staging

   # Reliable deployment
   npm run deploy              # Generates frontend assets + clean deploy to staging
   npm run deploy:prod         # Generates frontend assets + clean deploy to production
   ```

   ### Why Staging-Only Development?

   Adobe I/O Files SDK requires proper credentials and runs best in Adobe's environment. By developing directly on staging:

   - ✅ **Reliable**: No local server proxy issues
   - ✅ **Real Environment**: Identical to production
   - ✅ **Team Friendly**: Everyone accesses the same staging URL
   - ✅ **Fast**: Adobe's deployment is quick enough for development
   - ✅ **Simple**: One environment, one URL

   ### Key URLs

   - **Staging App**: Check Adobe Developer Console after `npm run deploy`
   - **Adobe Experience Platform**: Links provided during deployment

   ### Development Process

   1. Make your changes locally
   2. Run `npm run deploy` for deployment to staging environment
   3. Test your changes on the staging URL
   4. Repeat until ready for production
   5. Deploy to production with `npm run deploy:prod`

## Project Structure

For a comprehensive overview of the project file structure, see the [**Project Structure Guide**](docs/architecture/project-structure.md).

### Quick Overview

```text
kukla-integration-service/
├── 🌐 API Mesh Integration
│   ├── mesh.json                  # API Mesh configuration (generated)
│   ├── mesh.config.js             # Mesh configuration source (JsonSchema)
│   └── src/mesh/schema/           # JSON Schema response definitions
├── ⚙️ actions/                    # Adobe I/O Runtime serverless functions
│   ├── get-products/              # REST API product export
│   ├── get-products-mesh/         # API Mesh product export (JsonSchema)
│   ├── download-file/             # File download operations
│   ├── delete-file/               # File deletion operations
│   └── browse-files/              # HTMX file browser interface
├── 🛠️ src/                        # Shared utilities and core logic
│   ├── core/                      # Configuration, HTTP, storage, tracing
│   ├── commerce/                  # Adobe Commerce API integration
│   └── htmx/                      # HTMX-specific utilities
├── 🌍 web-src/                    # Frontend assets with HTMX enhancement
├── 📋 config/                     # Environment-aware configuration system
├── 🔧 scripts/                    # Build and testing utilities
└── 📚 docs/                       # Comprehensive documentation
```

**Key Architecture Features:**

- **JsonSchema Sources**: API Mesh consolidates data from multiple Commerce APIs into single GraphQL query
- **Domain-Driven Design**: Actions use hierarchical domain workflows from `src/`
- **Configuration System**: Environment-aware with schema validation
- **Progressive Enhancement**: HTMX-first frontend with minimal JavaScript

## Documentation

Our documentation is organized into focused guides:

- **Core Guides**

  - [Architecture](docs/architecture.md) - System design and patterns
  - [Development](docs/development.md) - Development workflow
  - [Development Modes](docs/development-modes.md) - Local vs Staging vs Production
  - [Security](docs/security.md) - Security practices
  - [Deployment](docs/deployment.md) - Deployment process
  - [Debugging](docs/debugging.md) - Debugging workflow and tools
  - [Configuration](docs/configuration.md) - Configuration system

- **Technical Guides**

  - [API Reference](docs/api-reference.md) - API endpoints
  - [Error Handling](docs/error-handling.md) - Error patterns
  - [File Operations](docs/file-operations.md) - File handling
  - [Performance](docs/performance.md) - Optimization guide

- [Testing Guide](docs/testing.md) - API testing process and tools

## Support

- Submit issues via [GitHub Issues](https://github.com/your-repo/issues)
- Check [Adobe App Builder Documentation](https://developer.adobe.com/app-builder/)

## Available Scripts

```bash
# Quick Development
npm run deploy              # Deploy to staging

# Reliable Deployment
npm run deploy              # Clean build and deploy to staging
npm run deploy:prod         # Clean build and deploy to production

# Building and Utilities
npm run build               # Build application only
npm run build:config        # Generate frontend configuration and URL modules
npm run clean               # Clean build artifacts

# Testing
npm run test:action         # Test individual actions
npm run test:perf           # Performance testing (staging)
npm run test:perf:prod      # Performance testing (production)
```

### Simplified Workflow

Our development approach uses staging workspace for all development:

1. **Development**: `npm run deploy` - Deploy to staging for testing
2. **Production**: `npm run deploy:prod` - Deploy to production

**Why staging-only?** Adobe I/O Files SDK requires proper credentials and works best in Adobe's environment. This approach eliminates local development complexity while providing a fast, reliable development experience.

### Testing Individual Actions

```bash
# Enhanced mode (default) - shows formatted output with spinners
npm run test:action get-products
npm run test:action browse-files

# Raw mode - outputs pure JSON for scripting/automation
npm run test:action get-products -- --raw
npm run test:action browse-files -- --raw

# Show available actions
npm run test:action
```
