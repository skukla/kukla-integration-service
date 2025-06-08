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

Create `.env` file in project root:

```bash
# Adobe I/O Configuration (auto-populated by Adobe I/O CLI)
AIO_runtime_auth=your-auth-token
AIO_runtime_namespace=your-namespace

# Adobe Commerce Credentials (ONLY username/password in .env)
COMMERCE_ADMIN_USERNAME=admin
COMMERCE_ADMIN_PASSWORD=your-admin-password

# AWS Storage Credentials (if using S3 storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Application Configuration
LOG_LEVEL=debug
CACHE_TTL=300

# File Storage
FILES_STORAGE_PREFIX=kukla-integration
FILES_MAX_SIZE=10485760
```

> **⚠️ Important**: Commerce URL comes from environment configuration files (`config/environments/staging.js` or `production.js`), NOT from `.env`. Never set `COMMERCE_URL` in `.env`.

### **Adobe Commerce Setup**

1. **Admin User Credentials**:

   - Use existing admin user credentials (username/password)
   - Add them to your `.env` file (see Environment Variables above)
   - The system uses admin token authentication automatically

2. **Commerce URL Configuration**:

   - Commerce URLs are configured per environment in `config/environments/`
   - Staging: `config/environments/staging.js` → `url.commerce.baseUrl`
   - Production: `config/environments/production.js` → `url.commerce.baseUrl`
   - Never manually specify Commerce URLs in actions or .env

3. **Required Commerce API Permissions**:
   - Catalog → Products (Read)
   - Inventory → Stock (Read)
   - System → Categories (Read)

### **app.config.yaml Configuration**

**CRITICAL**: You must add your credentials to `app.config.yaml` inputs for actions to access them:

```yaml
actions:
  backend:
    function: actions/backend/index.js
    web: 'yes'
    runtime: nodejs:18
    inputs:
      COMMERCE_ADMIN_USERNAME: $COMMERCE_ADMIN_USERNAME
      COMMERCE_ADMIN_PASSWORD: $COMMERCE_ADMIN_PASSWORD
      AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
      AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
      NODE_ENV: $NODE_ENV
```

> **Why This Matters**: Adobe I/O Runtime passes credentials as action parameters, not environment variables. Without proper `inputs` configuration, actions cannot access your credentials.

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
# Test specific backend action (auto-loads Commerce config and credentials)
npm run test:action -- actions/backend/get-products

# Test other actions that require parameters
npm run test:action -- actions/backend/download-file --param fileId=abc123

# Test frontend actions
npm run test:action -- actions/frontend/browse-files
```

> **No Manual Parameters Needed**: The test script automatically loads Commerce URL from environment configuration and credentials from `.env` file for get-products.

### **File Structure for Development**

```text
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

### **Git Hooks Setup**

The project uses Husky v9.1.7 for automated code quality via git hooks:

```bash
# Verify git hooks are active (should show .husky/_)
git config --get core.hooksPath

# If not configured, activate hooks
npx husky install

# Test the pre-commit hook
echo "const test='hello'" > test.js
git add test.js
git commit -m "Test commit"  # Should auto-format the file
```

**What the pre-commit hook does:**

- **JavaScript files**: ESLint + Prettier formatting
- **JSON/YAML files**: Prettier formatting  
- **Markdown files**: markdownlint + Prettier formatting
- **Automatic fixes**: Applied and included in the commit
- **Git stash backup**: Protects your original changes

> **Note**: The `npx husky install` command shows a deprecation warning but works correctly. This is expected behavior in Husky v9.

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
