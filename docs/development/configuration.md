# Development Configuration Guide

> **Practical configuration patterns for Adobe App Builder development with working examples**

## Overview

This guide provides **practical, working configuration patterns** for development. Unlike deployment configuration, this focuses on **what developers need to know** to write and test code effectively.

## Critical Configuration Concepts

### **The Configuration Split Pattern**

**NEVER** mix configuration sources. Follow this established pattern:

| Configuration Type              | Source                           | Access Method             | Example                            |
| ------------------------------- | -------------------------------- | ------------------------- | ---------------------------------- |
| **URLs & Environment Settings** | `config/environments/staging.js` | `loadConfig(params)`      | Commerce URL, API endpoints        |
| **Credentials & Secrets**       | `.env` file                      | `params.VARIABLE_NAME`    | Username, password, API keys       |
| **Feature Flags**               | Environment config               | `config.features.enabled` | Debug mode, performance monitoring |

```javascript
// ✅ CORRECT: Configuration pattern in actions
async function main(params) {
  const config = loadConfig(params); // URLs from environment config
  const username = params.COMMERCE_ADMIN_USERNAME; // Credentials from .env
  const commerceUrl = config.url.commerce.baseUrl; // URL from config
}
```

### **Adobe I/O Runtime Parameter Handling**

**NEVER** use `process.env` in actions. Use the parameter pattern:

```javascript
// ❌ WRONG: Environment variables (fails in Runtime)
async function main(params) {
  const key = process.env.AWS_ACCESS_KEY_ID; // Will be undefined!
}

// ✅ CORRECT: Action parameters
async function main(params) {
  const key = params.AWS_ACCESS_KEY_ID; // From app.config.yaml inputs
}
```

## Configuration Setup Checklist

### **1. Environment File (.env)**

Create `.env` in project root with **credentials only**:

```bash
# Adobe I/O Configuration (auto-populated by CLI)
AIO_runtime_auth=your-auth-token
AIO_runtime_namespace=your-namespace

# Commerce Credentials
COMMERCE_ADMIN_USERNAME=admin
COMMERCE_ADMIN_PASSWORD=your-password

# AWS Storage Credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Optional: Override environment detection
NODE_ENV=staging
```

### **2. App Config Inputs (app.config.yaml)**

**CRITICAL**: Add credentials to inputs for Runtime access:

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

### **3. Environment Configuration Files**

URLs and environment settings go in `config/environments/`:

**config/environments/staging.js**:

```javascript
module.exports = {
  url: {
    commerce: {
      baseUrl: 'https://citisignal-com774.adobedemo.com',
    },
  },
  storage: {
    provider: 'app-builder', // Uses Adobe I/O Files
  },
  app: {
    monitoring: {
      tracing: {
        performance: { enabled: true },
        errorVerbosity: 'detailed',
      },
    },
  },
};
```

## Configuration Loading Patterns

### **Unified Configuration Loading**

Use the lazy loader pattern for consistent configuration:

```javascript
// src/core/config/lazy-loader.js pattern
const { createLazyConfigGetter } = require('../config/lazy-loader');
const getConfig = createLazyConfigGetter();

async function someFunction(params) {
  const config = getConfig(params); // Lazy loads with parameter support
  return config.url.commerce.baseUrl;
}
```

### **Action Configuration Pattern**

Standard pattern for all actions:

```javascript
const { response } = require('../../../src/core/http/client');
const { loadConfig } = require('../../../src/core/config');
const { extractActionParams } = require('../../../src/core/http/client');

async function main(params) {
  try {
    // 1. Load configuration and extract parameters
    const config = loadConfig(params);
    const actionParams = extractActionParams(params);

    // 2. Access configuration
    const commerceUrl = config.url.commerce.baseUrl;
    const username = actionParams.COMMERCE_ADMIN_USERNAME;

    // 3. Use configuration
    const apiClient = new CommerceClient({
      baseUrl: commerceUrl,
      username: username,
      password: actionParams.COMMERCE_ADMIN_PASSWORD,
    });

    return response.success({ data: result });
  } catch (error) {
    return response.error(error.message, 500);
  }
}
```

## Storage Configuration

### **Environment-Based Storage Selection**

```javascript
// Storage automatically switches based on environment
const config = loadConfig(params);

// Staging: Uses Adobe I/O Files (config.storage.provider = 'app-builder')
// Production: Uses S3 (config.storage.provider = 's3')

const storage = await initializeStorage(params); // Auto-detects from config
```

### **Storage Provider Configuration**

**Staging (Adobe I/O Files)**:

```javascript
// config/environments/staging.js
module.exports = {
  storage: {
    provider: 'app-builder',
    // No additional config needed - uses Adobe I/O Files SDK
  },
};
```

**Production (S3)**:

```javascript
// config/environments/production.js
module.exports = {
  storage: {
    provider: 's3',
    s3: {
      bucket: 'your-production-bucket',
      region: 'us-east-1',
    },
  },
};
```

## Tracing and Monitoring Configuration

### **Dynamic Tracing Configuration**

**NEVER** use global constants. Always load dynamically:

```javascript
// ✅ CORRECT: Dynamic tracing configuration
function createTraceContext(actionName, params) {
  const tracingConfig = getTracingConfig(params); // Load from environment
  const trace = {
    config: tracingConfig, // Store for later use
    actionName,
    startTime: Date.now(),
  };
}

// ✅ CORRECT: Use stored config
if (context.config.performance.enabled) {
  // performance tracking
}
```

### **Tracing Configuration Structure**

```javascript
// Environment configuration for tracing
module.exports = {
  app: {
    monitoring: {
      tracing: {
        performance: { enabled: true },
        errorVerbosity: 'detailed', // 'minimal', 'detailed'
      },
    },
  },
};
```

## Commerce Configuration

### **Commerce URL Pattern**

**URLs**: Always from environment configuration
**Credentials**: Always from .env file

```javascript
// ✅ CORRECT: Commerce configuration pattern
async function main(params) {
  const config = loadConfig(params);

  // URL from environment config
  const commerceUrl = config.url.commerce.baseUrl;

  // Credentials from .env (via params)
  const username = params.COMMERCE_ADMIN_USERNAME;
  const password = params.COMMERCE_ADMIN_PASSWORD;

  const client = new CommerceClient({
    baseUrl: commerceUrl,
    username,
    password,
  });
}
```

### **Environment-Specific Commerce URLs**

**Staging**: `https://citisignal-com774.adobedemo.com`
**Production**: `https://your-production-commerce.com`

Configure in respective environment files, **never** hardcode.

## Testing Configuration

### **Test Script Auto-Loading**

The `test-action.js` script automatically handles configuration:

```bash
# Auto-loads Commerce URL from config and credentials from .env
node scripts/test-action.js get-products

# No manual parameters needed for get-products!
```

### **Configuration Testing Patterns**

```javascript
// Test configuration loading
describe('Configuration', () => {
  test('loads Commerce URL from environment config', () => {
    const config = loadConfig({ NODE_ENV: 'staging' });
    expect(config.url.commerce.baseUrl).toBe('https://citisignal-com774.adobedemo.com');
  });

  test('accesses credentials via parameters', () => {
    const params = { COMMERCE_ADMIN_USERNAME: 'admin' };
    const actionParams = extractActionParams(params);
    expect(actionParams.COMMERCE_ADMIN_USERNAME).toBe('admin');
  });
});
```

## Configuration Validation

### **Parameter Validation**

```javascript
const { validateRequired } = require('../../../src/core/validation');

async function main(params) {
  // Validate required parameters
  const requiredParams = ['COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];
  const validation = validateRequired(params, requiredParams);

  if (!validation.isValid) {
    return response.error(`Missing required parameters: ${validation.missing.join(', ')}`, 400);
  }

  // Continue with action...
}
```

### **Environment Validation**

```javascript
// Validate environment-specific requirements
function validateEnvironment(config) {
  if (config.environment === 'production') {
    if (!config.app.monitoring.tracing.performance.enabled) {
      throw new Error('Performance monitoring required in production');
    }
  }
}
```

## Common Configuration Issues

### **1. "Response is not valid 'message/http'" Error**

**Cause**: Inconsistent configuration loading
**Solution**: Use `createLazyConfigGetter` pattern everywhere

### **2. Credentials Not Found in Actions**

**Cause**: Missing `app.config.yaml` inputs
**Solution**: Add credentials to inputs section

### **3. Wrong Storage Provider**

**Cause**: Environment detection issue
**Solution**: Pass `params` to `loadConfig()` and `initializeStorage()`

### **4. Commerce URL Undefined**

**Cause**: Accessing wrong configuration source
**Solution**: Use `config.url.commerce.baseUrl`, not `.env`

### **5. Tracing Errors**

**Cause**: Using undefined global constants
**Solution**: Use `getTracingConfig(params)` for dynamic loading

## Configuration Best Practices

### **1. Consistent Parameter Handling**

```javascript
// Standard action setup
async function main(params) {
  const config = loadConfig(params); // Load config first
  const actionParams = extractActionParams(params); // Extract parameters

  // Use configuration consistently
  const setting = config.app.features.enabled;
  const credential = actionParams.API_KEY;
}
```

### **2. Environment Detection**

```javascript
// Let the config system handle environment detection
const config = loadConfig(params); // params.NODE_ENV overrides process.env.NODE_ENV

// Don't manually detect environment
const env = config.environment; // Use config.environment, not process.env.NODE_ENV
```

### **3. Error Handling**

```javascript
try {
  const config = loadConfig(params);
} catch (error) {
  return response.error(`Configuration error: ${error.message}`, 500);
}
```

### **4. Security**

```javascript
// Never log credentials
const sanitizedParams = { ...params };
delete sanitizedParams.COMMERCE_ADMIN_PASSWORD;
delete sanitizedParams.AWS_SECRET_ACCESS_KEY;
logger.debug('Action parameters', sanitizedParams);
```

## Action Response Configuration

### **Response Structure for Test Scripts**

Actions should return structured responses:

```javascript
return response.success({
  message: 'Operation completed successfully',
  steps: [
    'Step 1: Loaded Commerce configuration',
    'Step 2: Authenticated with Commerce API',
    'Step 3: Fetched product and inventory data',
    'Step 4: Generated CSV file',
    'Step 5: Uploaded to Adobe I/O Files storage',
  ],
  downloadUrl: 'https://storage.url/file.csv',
  storage: {
    provider: 'app-builder', // or 's3'
    location: 'exports/products-export.csv',
    properties: {
      size: 15360,
      contentType: 'text/csv',
    },
  },
});
```

## Integration Patterns

### **Commerce Integration**

```javascript
const { CommerceApiClient } = require('../../../src/commerce/api/client');

async function main(params) {
  const config = loadConfig(params);

  const commerceClient = new CommerceApiClient({
    baseUrl: config.url.commerce.baseUrl,
    username: params.COMMERCE_ADMIN_USERNAME,
    password: params.COMMERCE_ADMIN_PASSWORD,
    config: config.commerce || {},
  });
}
```

### **Storage Integration**

```javascript
const { initializeStorage } = require('../../../src/core/storage');

async function main(params) {
  const storage = await initializeStorage(params); // Auto-configures based on environment

  const result = await storage.upload('file.csv', csvData, {
    contentType: 'text/csv',
  });
}
```

## Development Workflow

### **1. Configuration-First Development**

1. Check existing configuration patterns in `src/core/config/`
2. Load configuration using established patterns
3. Extract parameters using `extractActionParams()`
4. Use configuration consistently throughout action

### **2. Testing Configuration**

1. Test with `npm run test:action` - auto-loads configuration
2. Verify environment-specific behavior
3. Test parameter validation
4. Check response structure

### **3. Debugging Configuration**

```javascript
// Add debug logging (remove before commit)
const config = loadConfig(params);
console.log('Loaded config:', { environment: config.environment });
console.log('Commerce URL:', config.url.commerce.baseUrl);
console.log('Storage provider:', config.storage.provider);
```

## Related Documentation

- **[Getting Started Setup](../getting-started/setup.md)** - Initial configuration setup
- **[Testing Guide](testing.md)** - Testing with configuration
- **[Deployment Configuration](../deployment/configuration.md)** - Deployment-specific config
- **[Commerce Integration](../architecture/commerce-integration.md)** - Commerce configuration details

---

_This development configuration guide provides practical patterns that work with Adobe I/O Runtime and the established project architecture._
