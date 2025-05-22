# Kukla Integration Service

## Overview

A streamlined Adobe App Builder application that integrates with Adobe Commerce to provide product data management and file operations through a simple, maintainable architecture.

## Quick Links

📚 [Architecture Guide](docs/architecture.md) - System design and components  
🛠️ [Development Guide](docs/development.md) - Setup and workflow  
🔒 [Security Guide](docs/security.md) - Security practices  
🐛 [Debugging Guide](docs/debugging.md) - Debugging process and tools

## Key Features

- **Product Management** - Export and manage Adobe Commerce product data
- **File Operations** - Secure file storage and handling
- **Simple Architecture** - Clear separation of concerns with focused components
- **HTMX Integration** - Dynamic UI updates without complex JavaScript
- **Performance Optimized** - Caching, compression, and efficient resource usage

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

4. **Development**
   ```bash
   npm run dev      # Start development
   npm run build    # Build the app
   npm run deploy   # Deploy to App Builder
   ```

## Project Structure

```
kukla-integration-service/
├── actions/              # Backend actions
│   ├── core/            # Core utilities
│   ├── commerce/        # Commerce integration
│   ├── htmx/           # HTMX utilities
│   ├── frontend/       # Frontend handlers
│   └── backend/        # Backend handlers
└── web-src/            # Frontend source
    └── src/
        └── js/
            ├── core/   # Core utilities
            ├── htmx/   # HTMX setup
            └── browser/ # UI components
```

## Documentation

Our documentation is organized into focused guides:

- **Core Guides**
  - [Architecture](docs/architecture.md) - System design and patterns
  - [Development](docs/development.md) - Development workflow
  - [Security](docs/security.md) - Security practices
  - [Deployment](docs/deployment.md) - Deployment process
  - [Debugging](docs/debugging.md) - Debugging workflow and tools

- **Technical Guides**
  - [API Reference](docs/api-reference.md) - API endpoints
  - [Error Handling](docs/error-handling.md) - Error patterns
  - [File Operations](docs/file-operations.md) - File handling
  - [Performance](docs/performance.md) - Optimization guide

- [Testing Guide](docs/testing.md) - API testing process and tools

## Support

- Submit issues via [GitHub Issues](https://github.com/your-repo/issues)
- Check [Adobe App Builder Documentation](https://developer.adobe.com/app-builder/)
