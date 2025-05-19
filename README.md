# Kukla Integration Service

## Overview

Kukla Integration Service is an Adobe App Builder application designed to integrate with Adobe Commerce (Magento) and provide product data and related functionality via secure, scalable APIs. The project leverages Adobe App Builder's serverless actions and File Store to deliver a robust backend for commerce and integration scenarios.

## Quick Start

1. **Prerequisites**
   - Node.js 18+
   - Adobe Developer Console Access
   - Adobe Commerce Instance
   - Adobe I/O CLI (`npm install -g @adobe/aio-cli`)
   - App Builder CLI Plugin (`aio plugins:install @adobe/aio-cli-plugin-app`)

2. **Installation**
   ```bash
   git clone <repository-url>
   cd kukla-integration-service
   npm install
   ```

3. **Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Development**
   ```bash
   npm run build         # Build the application
   npm run deploy:full   # Deploy everything
   npm run deploy:web    # Deploy only web assets
   ```

## Key Features

- **Product Data Export** - Fetch, enrich, and export product data as CSV
- **File Store Integration** - Secure file storage and management
- **Secure Credential Management** - Environment-based configuration

## Documentation

- [Architecture Guide](docs/architecture.md) - Application structure and design
- [Development Guide](docs/development.md) - Setup, workflow, and best practices
- [API Reference](docs/api-reference.md) - API endpoints and usage
- [Design System](docs/design-system.md) - UI components and styling
- [Deployment Guide](docs/deployment.md) - Deployment process and environments
- [Security Guide](docs/security.md) - Security practices and considerations
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

## Project Structure

```
/
├── actions/              # Server-side code
│   ├── frontend/        # UI-supporting actions
│   ├── backend/         # Business logic actions
│   └── shared/          # Common utilities
├── web-src/             # Client-side application
├── docs/                # Documentation
└── test/                # Test files
```

For detailed documentation about each directory, see the [Architecture Guide](docs/architecture.md).

## Import Aliases

- Server-side: `@shared`, `@frontend-actions`, `@backend-actions`
- Client-side: `@/`, `@styles/`, `@js/`, `@components/`

See the [Development Guide](docs/development.md) for detailed usage.

## Contributing

See our [Contributing Guide](docs/contributing.md) for details about development workflow and submitting pull requests.

## Support

For issues and feature requests:
- Submit [GitHub Issues](https://github.com/your-repo/issues)
- Contact the project maintainers
- Check [Adobe App Builder Documentation](https://developer.adobe.com/app-builder/)
