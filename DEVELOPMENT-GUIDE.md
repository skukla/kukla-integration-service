# DEVELOPMENT-GUIDE.md

This file provides development guidelines and architectural patterns for this repository.

## Project Overview

This is an Adobe App Builder application that integrates with Adobe Commerce for product data management and file operations. The project uses a staging-first development approach with HTMX for frontend interactions.

## Essential Commands

### Development & Deployment

```bash
npm run deploy              # Deploy to staging (includes automatic mesh updates)
npm run deploy:prod         # Deploy to production
npm run build               # Build application only
npm run build:config        # Generate frontend configuration and URL modules
npm run clean               # Clean build artifacts
```

### Testing & Validation

```bash
npm run test:action         # Test individual actions
npm run test:perf           # Performance testing (staging)
npm run test:suite          # Full test suite
npm run lint                # ESLint validation
npm run format              # Format code with Prettier
```

### API Mesh

```bash
npm run deploy:mesh         # Update API Mesh configuration
npm run build:mesh          # Build mesh configuration
```

## Architecture Overview

### Core Structure

- **Adobe App Builder**: Node.js serverless functions on Adobe I/O Runtime
- **Frontend**: HTMX with vanilla JavaScript for dynamic UI updates
- **Commerce Integration**: Adobe Commerce API with admin token authentication
- **API Mesh**: GraphQL consolidation layer for multiple Commerce APIs
- **File Storage**: Adobe I/O Files SDK and S3 integration

### Domain-Driven Organization

```text
src/
├── core/           # Shared utilities (HTTP, monitoring, validation, etc.)
├── commerce/       # Adobe Commerce API integration
├── products/       # Product data processing workflows
├── files/          # File operations and storage strategies
├── htmx/          # HTMX-specific utilities
└── mesh/          # API Mesh schema definitions

actions/
├── get-products/       # REST API product export
├── get-products-mesh/  # API Mesh product export
├── browse-files/       # HTMX file browser interface
├── download-file/      # File download operations
└── delete-file/        # File deletion operations
```

### Key Architectural Patterns

- **Configuration System**: Environment-aware configuration with schema validation
- **Step Functions**: Reusable business logic components (e.g., `buildProducts`, `createCsv`, `storeCsv`)
- **Domain Workflows**: Hierarchical organization of operations and utilities
- **True Mesh Pattern**: API Mesh consolidates 200+ API calls into single GraphQL queries

## Critical Development Rules

### **⚠️ REFACTORING IN PROGRESS**: Adobe Standards Migration

This project is migrating from over-engineered patterns to Adobe App Builder standard patterns. Follow Adobe standards, not legacy patterns.

### Adobe Standard Action Pattern

- **Use Direct Exports**: `exports.main = main` (NOT action factories)
- **Use Adobe SDK**: `const { Core } = require('@adobe/aio-sdk')`
- **Use Adobe Utils**: Import from `actions/utils.js` following Adobe patterns
- **Standard Validation**: Use `checkMissingRequestInputs()` from Adobe utils
- **Standard Logging**: Use `Core.Logger()` from Adobe SDK
- **Standard Errors**: Use `errorResponse()` from Adobe utils

### Commerce API Integration  

- **Admin Token Authentication**: Use admin username/password to generate bearer tokens
- **Required Credentials**: `COMMERCE_ADMIN_USERNAME`, `COMMERCE_ADMIN_PASSWORD`
- **Direct API Calls**: Use `fetch()` directly with bearer token headers
- **Never use `process.env`** in Adobe I/O Runtime actions - always use `params.VARIABLE_NAME`

### Configuration Management

- **Single Config File**: Use `config.js` with direct environment variable access
- **No Complex Validation**: Simple parameter checks only
- **Direct Access**: `config.commerce.baseUrl` (no optional chaining)
- **Adobe Pattern**: Follow Adobe's simple configuration approach

### API Mesh Development

- **Template-First**: Always edit `mesh-resolvers.template.js`, never `mesh-resolvers.js` directly
- **Raw Data Only**: Mesh resolvers return raw consolidated data, never transform data
- **Always Use buildProducts**: Actions must use `buildProducts` step for data transformation
- **Complete Workflow**: Use `npm run deploy` for mesh resolver changes (includes regeneration and deployment)

### URL Management

- **Backend Actions**: Use configuration objects directly - no URL builders needed
  - Commerce APIs: `config.commerce.baseUrl` + simple concatenation
  - API Mesh: `config.mesh.endpoint` directly
  - Example: `${config.commerce.baseUrl}/rest/${config.commerce.api.version}/products`
- **HTMX HTML Generation**: Use `buildDownloadUrl()` for dynamic runtime URLs only
  - Required for server-side HTML that generates client-side download links
  - Handles dynamic namespace/host resolution

### Storage Operations

- **Function Signature**: `storeCsv(csvData, actionParams)` - exactly 2 parameters
- **Error Checking**: Always verify `storageResult.stored` before proceeding
- **No Manual Initialization**: Let `storeCsv()` handle storage initialization internally

## Testing Framework

### Action Testing

```bash
# Test specific actions
npm run test:action get-products
npm run test:action get-products-mesh
npm run test:action browse-files

# Raw output for scripting
npm run test:action get-products -- --raw
```

### Performance Testing

```bash
npm run test:perf           # Quick performance test
npm run test:perf:list      # List available scenarios
npm run test:suite          # Full test suite
```

## Common Pitfalls to Avoid

### Adobe I/O Runtime Specific

- **Never use `process.env`** in actions - causes catastrophic failures with no logs
- **Use action parameters**: Access via `params.VARIABLE_NAME` (from `.env` → `app.config.yaml` → `params`)
- **URL Domain Separation**: Frontend (static domain) vs Actions (runtime domain) require absolute URLs

### API Mesh Limitations

- **No Node.js Modules**: Cannot `require()` modules in mesh resolvers
- **Template Literals**: Not fully supported - use string concatenation
- **Single Line Types**: `additionalTypeDefs` must be single-line strings in arrays

### Storage Patterns

- **Circular Dependencies**: Always use `storeCsv()` function, never manual storage initialization
- **Function Parameters**: `storeCsv(csvData, actionParams)` only - 2 parameters exactly

## Frontend Development

### HTMX Integration

- Use HTMX attributes for dynamic UI updates
- Progressive enhancement approach with minimal JavaScript
- Graceful fallbacks when JavaScript is disabled

### Design System Compliance

- Always use design system tokens (`--token-name`) instead of hardcoded values
- Extend base components (`.btn`, `.card`) rather than creating from scratch
- Complete content hiding during loading states: `visibility: hidden !important`

## Environment & Deployment

### Staging-First Development

- All development uses staging workspace for reliable testing
- Adobe I/O Files SDK requires proper credentials - works best in Adobe's environment
- Quick development cycle via `npm run deploy`

### Production Deployment

- `npm run deploy:prod` for production deployment
- Always test in staging before production
- Mesh updates: `npm run deploy:mesh:prod` for production mesh changes

## Documentation Structure

Comprehensive documentation available in `docs/`:

- `docs/architecture/` - System design and patterns
- `docs/development/` - Development workflows and standards
- `docs/deployment/` - Environment configuration and deployment
- `docs/getting-started/` - Setup and overview guides
