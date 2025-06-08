# Deployment Guide

> **Adobe App Builder deployment workflow for staging-first development**

## Overview

This guide covers the deployment process for the Adobe App Builder Commerce integration service. The project uses a staging-first approach where all development happens through cloud deployments.

## Deployment Scripts

### **Quick Development Iteration**

```bash
# Build and deploy to staging automatically
npm start
# ↳ Builds and deploys to staging
# ↳ Opens browser to staging URL
# ↳ Watches for file changes and auto-redeploys
```

### **Reliable Staging Deployment**

```bash
# Clean build and deploy to staging
npm run deploy
# ↳ Cleans dist directory
# ↳ Full build process
# ↳ Deploy to staging workspace
```

### **Production Deployment**

```bash
# Deploy to production workspace
npm run deploy:prod
# ↳ Clean build and deploy to production
# ↳ Production workspace configuration
```

### **Manual Build Process**

```bash
# Build without deploying
npm run build
# ↳ Builds actions and web assets to dist/

# Clean build artifacts
npm run clean
# ↳ Removes dist/ directory
```

## Environment Configuration

### **Adobe I/O Workspaces**

The application uses Adobe I/O workspaces for environment separation:

- **Stage** (default): Development and testing environment
- **Production**: Live environment for end users

### **Environment Variables**

Required environment variables for deployment:

```bash
# Adobe I/O Runtime Configuration
AIO_runtime_auth=your-runtime-auth-token
AIO_runtime_namespace=your-namespace

# Adobe Commerce Configuration
COMMERCE_BASE_URL=https://your-commerce-instance.com
COMMERCE_ACCESS_TOKEN=your-access-token
COMMERCE_CONSUMER_KEY=your-consumer-key
COMMERCE_CONSUMER_SECRET=your-consumer-secret

# Application Configuration
LOG_LEVEL=info  # debug, info, warn, error
NODE_ENV=production  # development, staging, production
```

### **Configuration Files**

#### **app.config.yaml**

Main Adobe App Builder configuration:

```yaml
application:
  actions: actions
  web: web-src
  runtimeManifest:
    packages:
      kukla-integration-service:
        license: Apache-2.0
        actions:
          get-products:
            function: actions/backend/get-products/index.js
            web: 'yes'
            runtime: nodejs:18
            inputs:
              LOG_LEVEL: debug
```

#### **Environment-Specific Configs**

Located in `config/environments/`:

```javascript
// config/environments/staging.js
module.exports = {
  commerce: {
    timeout: 30000,
    rateLimit: { requests: 100, window: 60000 },
  },
  logging: { level: 'debug' },
  features: { debugMode: true },
};

// config/environments/production.js
module.exports = {
  commerce: {
    timeout: 15000,
    rateLimit: { requests: 200, window: 60000 },
  },
  logging: { level: 'info' },
  features: { debugMode: false },
};
```

## Deployment Workflow

### **Development Cycle**

```bash
# 1. Start development with auto-deploy
npm start

# 2. Make code changes
# Files are automatically watched and redeployed

# 3. Test changes in browser
# Staging URL opens automatically

# 4. When satisfied, deploy clean build
npm run deploy

# 5. Test thoroughly in staging

# 6. Deploy to production
npm run deploy:prod
```

### **Pre-deployment Checklist**

Before deploying:

1. **Test Actions Locally**

   ```bash
   # Test critical actions
   npm run test:action -- actions/backend/get-products
   npm run test:action -- actions/frontend/browse-files
   ```

2. **Run Performance Tests**

   ```bash
   npm run test:perf
   ```

3. **Verify Configuration**

   ```bash
   # Check environment variables
   echo $COMMERCE_BASE_URL
   echo $LOG_LEVEL

   # Validate app.config.yaml
   aio app:info
   ```

4. **Code Quality Checks**

   ```bash
   # Run linting
   npm run lint

   # Format code
   npm run format
   ```

### **Deployment Process**

#### **Staging Deployment**

```bash
# Option 1: Quick development deployment
npm start
# - Watches for changes
# - Auto-redeploys on file changes
# - Opens browser to staging URL

# Option 2: Clean build deployment
npm run deploy
# - Runs clean build
# - Deploys to staging workspace
# - More reliable for testing
```

#### **Production Deployment**

```bash
# Deploy to production workspace
npm run deploy:prod

# This process:
# 1. Cleans dist/ directory
# 2. Builds all actions and web assets
# 3. Deploys to production workspace
# 4. Uses production environment configuration
```

## Environment Management

### **Staging Environment**

**Purpose**: Development, testing, and feature validation

**Configuration**:

- Enhanced logging (debug level)
- Longer timeouts for debugging
- Debug mode enabled
- Relaxed rate limiting

**URL Pattern**: `https://{namespace}-stage.adobeio-static.net`

**Usage**:

```bash
# Deploy to staging
npm run deploy

# Test in staging
npm run test:action -- actions/backend/get-products
```

### **Production Environment**

**Purpose**: Live user-facing application

**Configuration**:

- Minimal logging (info level)
- Optimized timeouts
- Debug mode disabled
- Strict rate limiting

**URL Pattern**: `https://{namespace}-production.adobeio-static.net`

**Usage**:

```bash
# Deploy to production
npm run deploy:prod

# Test in production (carefully!)
npm run test:perf:prod
```

## Monitoring and Verification

### **Post-Deployment Checks**

After each deployment, verify:

1. **Application Health**

   ```bash
   # Test key endpoints
   npm run test:action -- actions/backend/get-products --param '{"categoryId":"test"}'

   # Check logs for errors
   aio runtime:log:get
   ```

2. **Frontend Functionality**

   ```bash
   # Open application URL
   open https://your-namespace-stage.adobeio-static.net

   # Test HTMX interactions
   # Verify file operations
   # Check for console errors
   ```

3. **Performance Verification**

   ```bash
   # Quick performance check
   npm run test:perf

   # Verify response times are within thresholds
   ```

### **Rollback Procedures**

If deployment issues occur:

1. **Quick Rollback**

   ```bash
   # Revert to last known good version
   git checkout <last-good-commit>
   npm run deploy:prod
   ```

2. **Emergency Rollback**

   ```bash
   # Use Adobe I/O CLI for immediate rollback
   aio app:undeploy
   aio app:deploy --version <previous-version>
   ```

## Continuous Integration

### **GitHub Actions Integration**

Example CI/CD workflow:

```yaml
name: Deploy to Adobe App Builder
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: |
          npm run test:action -- actions/backend/get-products
          npm run test:perf
        env:
          COMMERCE_BASE_URL: ${{ secrets.COMMERCE_BASE_URL }}
          COMMERCE_ACCESS_TOKEN: ${{ secrets.COMMERCE_ACCESS_TOKEN }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: npm run deploy
        env:
          AIO_runtime_auth: ${{ secrets.AIO_RUNTIME_AUTH }}
          AIO_runtime_namespace: ${{ secrets.AIO_RUNTIME_NAMESPACE }}

  deploy-production:
    needs: [test, deploy-staging]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: npm run deploy:prod
        env:
          AIO_runtime_auth: ${{ secrets.AIO_RUNTIME_AUTH_PROD }}
          AIO_runtime_namespace: ${{ secrets.AIO_RUNTIME_NAMESPACE_PROD }}
```

## Troubleshooting

### **Common Deployment Issues**

1. **Authentication Errors**

   ```bash
   # Re-authenticate with Adobe I/O
   aio auth:login
   aio console:project:select

   # Verify authentication
   aio app:info
   ```

2. **Build Failures**

   ```bash
   # Clean and rebuild
   npm run clean
   npm run build

   # Check for syntax errors
   npm run lint
   ```

3. **Environment Variable Issues**

   ```bash
   # Verify environment variables
   echo $AIO_runtime_auth
   echo $COMMERCE_BASE_URL

   # Check Adobe I/O configuration
   cat ~/.aio
   ```

4. **Workspace Issues**

   ```bash
   # List available workspaces
   aio console:workspace:list

   # Select correct workspace
   aio console:workspace:select
   ```

### **Performance Issues**

1. **Slow Deployments**

   ```bash
   # Use npm start for faster iteration during development
   npm start

   # Use npm run deploy for clean builds
   npm run deploy
   ```

2. **Action Timeout Issues**

   ```bash
   # Check action timeout configuration in app.config.yaml
   # Increase timeout if necessary for long-running operations
   ```

### **Debugging Deployment Issues**

```bash
# Enable verbose logging
LOG_LEVEL=debug npm run deploy

# Check Adobe I/O Runtime logs
aio runtime:log:get

# View specific action logs
aio runtime:log:get --action get-products

# Check deployment status
aio app:info
```

## Security Considerations

### **Secrets Management**

- Store sensitive configuration in environment variables
- Use Adobe Developer Console for credential management
- Never commit secrets to version control
- Rotate credentials regularly

### **Access Control**

- Limit Adobe Developer Console access
- Use principle of least privilege
- Monitor deployment activities
- Implement approval workflows for production

## Related Documentation

- **[Development Setup](../getting-started/setup.md)** - Environment configuration
- **[Testing Guide](../development/testing.md)** - Pre-deployment testing
- **[Configuration Management](configuration.md)** - Environment configuration
- **[Security Practices](security.md)** - Security guidelines

---

_This deployment guide covers the Adobe App Builder staging-first development workflow and production deployment processes._
