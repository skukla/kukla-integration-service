# Development Setup

> **Get your Adobe App Builder development environment ready for the Kukla Integration Service**

## Prerequisites

### **Required Software**

- **Node.js** >= 18.0.0 (LTS recommended)
- **npm** >= 8.0.0
- **Git** for version control
- **Adobe I/O CLI** for deployment

### **Adobe Developer Access**

- Adobe Developer Console account
- Adobe I/O App Builder access
- Adobe Commerce instance (for testing)

## Quick Setup

### 1. **Clone and Install**

```bash
# Clone the repository
git clone <repository-url> kukla-integration-service
cd kukla-integration-service

# Install dependencies
npm install

# Install Adobe I/O CLI globally
npm install -g @adobe/aio-cli
```

### 2. **Adobe I/O CLI Setup**

```bash
# Install App Builder plugin
aio plugins:install @adobe/aio-cli-plugin-app-builder

# Login to Adobe I/O
aio auth:login

# Select your organization and project
aio console:project:select
```

### 3. **Environment Configuration**

```bash
# Copy environment template
cp config/environments/.env.example config/environments/.env.staging

# Edit configuration (see Configuration section below)
nano config/environments/.env.staging
```

### 4. **Verify Setup**

```bash
# Test the application
npm start

# Test individual actions
npm run test:action -- actions/backend/get-products

# Deploy to staging
npm run deploy
```

## Configuration

### **Environment Variables**

Create `config/environments/.env.staging`:

```bash
# Adobe I/O Configuration
AIO_runtime_auth=your-auth-token
AIO_runtime_namespace=your-namespace

# Adobe Commerce Configuration
COMMERCE_BASE_URL=https://your-commerce-instance.com
COMMERCE_ACCESS_TOKEN=your-commerce-token
COMMERCE_CONSUMER_KEY=your-consumer-key
COMMERCE_CONSUMER_SECRET=your-consumer-secret

# Application Configuration
APP_ENV=staging
LOG_LEVEL=debug
CACHE_TTL=300

# File Storage
FILES_STORAGE_PREFIX=kukla-integration
FILES_MAX_SIZE=10485760
```

### **Adobe Commerce Setup**

1. **Create Integration in Commerce Admin**:

   - Navigate to System > Extensions > Integrations
   - Create new integration with appropriate permissions
   - Copy the generated tokens

2. **Required Permissions**:
   - Catalog → Products (Read)
   - System → Configuration (Read)
   - Files → Media (Read/Write)

### **Adobe Developer Console Configuration**

1. **Project Setup**:

   - Create new project in Adobe Developer Console
   - Add App Builder service
   - Configure workspace for staging and production

2. **Service Account**:
   - Generate JWT credentials
   - Download service account JSON
   - Configure in Adobe I/O CLI

## Development Workflow

### **Staging-First Development**

This project uses a staging-first approach - there's no local server:

```bash
# Quick iteration during development
npm start
# ↳ Builds and deploys to staging automatically
# ↳ Opens browser to staging URL
# ↳ Watches for file changes

# More reliable deployment
npm run deploy
# ↳ Full build and deploy process
# ↳ Better for testing complex changes

# Production deployment
npm run deploy:prod
# ↳ Deploys to production workspace
```

### **Testing Individual Actions**

```bash
# Test specific backend action
npm run test:action -- actions/backend/get-products

# Test with parameters
npm run test:action -- actions/backend/get-products --param category=electronics

# Test frontend action
npm run test:action -- actions/frontend/browse-files
```

### **File Structure for Development**

```
kukla-integration-service/
├── actions/
│   ├── backend/           # API endpoints - your main backend logic
│   │   ├── get-products/
│   │   ├── download-file/
│   │   └── delete-file/
│   └── frontend/          # HTMX response handlers
│       └── browse-files/
├── src/                   # Shared utilities - check here first!
│   ├── core/             # Common utilities (HTTP, validation, etc.)
│   ├── htmx/             # HTMX helpers and response utilities
│   └── commerce/         # Adobe Commerce integration utilities
├── web-src/              # Frontend assets
├── config/               # Environment configurations
└── docs/                 # This documentation
```

## Development Best Practices

### **Before Writing New Code**

1. **Check `src/core/` first** - Don't recreate existing utilities
2. **Review similar actions** - Follow established patterns
3. **Check configuration system** - Use schema-validated configs
4. **Reference documentation** - Follow the coding standards

### **Adobe App Builder Patterns**

```javascript
// Example action structure
const { Core } = require('@adobe/aio-sdk');
const { getCommerceProducts } = require('../../src/commerce/api');
const { validateInput } = require('../../src/core/validation');
const { createSuccessResponse } = require('../../src/core/responses');

async function main(params) {
  const logger = Core.Logger('get-products', { level: params.LOG_LEVEL });

  try {
    // 1. Validate input
    const validatedParams = validateInput(params, productSchema);

    // 2. Use shared utilities
    const products = await getCommerceProducts(validatedParams);

    // 3. Return consistent response
    return createSuccessResponse(products);
  } catch (error) {
    logger.error('Product export failed', error);
    return createErrorResponse(error);
  }
}

exports.main = main;
```

### **HTMX Integration Patterns**

```javascript
// Frontend action for HTMX responses
const { createHTMXResponse } = require('../../src/htmx/responses');

async function main(params) {
  const data = await fetchData(params);

  // Return HTMX-compatible response
  return createHTMXResponse({
    template: 'product-list',
    data,
    headers: {
      'HX-Trigger': 'products-updated',
    },
  });
}
```

## Debugging and Troubleshooting

### **Common Issues**

1. **Authentication Errors**:

   ```bash
   # Re-authenticate with Adobe I/O
   aio auth:login
   aio console:project:select
   ```

2. **Deployment Failures**:

   ```bash
   # Check Adobe I/O CLI configuration
   aio app:info

   # Validate configuration
   npm run config:validate
   ```

3. **Commerce API Issues**:

   ```bash
   # Test Commerce connection
   npm run test:commerce-connection

   # Check rate limits
   npm run test:commerce-rate-limits
   ```

### **Logging and Monitoring**

```javascript
// Use structured logging
const logger = Core.Logger('action-name', { level: params.LOG_LEVEL });

logger.info('Starting operation', { productId: params.id });
logger.debug('API request details', { url, headers });
logger.error('Operation failed', error);
```

### **Performance Testing**

```bash
# Test action performance
npm run perf:test -- actions/backend/get-products

# Load testing
npm run perf:load-test

# Memory usage analysis
npm run perf:memory-test
```

## IDE Configuration

### **Cursor/VS Code Settings**

The project includes `.cursor/rules/` and `.cursorrules` for enhanced AI assistance:

- **Context-aware suggestions** for Adobe App Builder patterns
- **HTMX integration patterns** for frontend development
- **Commerce API integration** guidance
- **Code quality standards** enforcement

### **Recommended Extensions**

- Adobe I/O App Builder extension
- HTMX syntax highlighting
- ESLint and Prettier (already configured)
- GitLens for version control

## Next Steps

Once your environment is set up:

1. **[Deployment Guide](deployment.md)** - Deploy your first changes
2. **[Coding Standards](../development/coding-standards.md)** - Learn the code patterns
3. **[Architecture Guide](../architecture/adobe-app-builder.md)** - Understand the platform
4. **[Testing Guide](../development/testing.md)** - Test your changes

## Getting Help

- **Setup issues?** Check the [troubleshooting section](#debugging-and-troubleshooting)
- **Adobe I/O problems?** See [Adobe's App Builder docs](https://developer.adobe.com/app-builder/docs/)
- **Commerce API issues?** Reference [Commerce Integration](../architecture/commerce-integration.md)
- **Code questions?** Follow [Coding Standards](../development/coding-standards.md)

---

_This setup guide gets you productive quickly with Adobe App Builder development patterns._
