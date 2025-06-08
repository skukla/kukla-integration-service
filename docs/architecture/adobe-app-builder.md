# Adobe App Builder Platform Architecture

> **Serverless application platform overview for Commerce integration**

## Platform Overview

Adobe App Builder is a complete framework for building cloud-native applications that extend Adobe Experience Cloud solutions. This guide covers the platform concepts and patterns used in the Kukla Integration Service.

## Core Concepts

### **Adobe I/O Runtime**

- **Serverless Functions**: Event-driven, stateless functions
- **Auto-scaling**: Handles traffic spikes automatically
- **Pay-per-execution**: Cost-effective for variable workloads
- **Integrated Security**: Built-in authentication and authorization

### **Adobe I/O Files**

- **Cloud Storage**: Persistent file storage for applications
- **SDK Integration**: Simple API for file operations
- **Security**: Secure file access with proper permissions
- **Performance**: Optimized for Adobe Experience Cloud integration

### **Adobe I/O Events**

- **Event-driven Architecture**: React to Adobe solution events
- **Webhooks**: Receive real-time notifications
- **Custom Events**: Trigger custom application logic
- **Reliability**: Built-in retry and error handling

## Application Architecture

### **Project Structure**

```
kukla-integration-service/
├── actions/                    # Adobe I/O Runtime actions
│   ├── backend/               # API endpoints (data processing)
│   │   ├── get-products/      # Product export from Commerce
│   │   ├── download-file/     # File download operations
│   │   └── delete-file/       # File deletion operations
│   └── frontend/              # UI response handlers
│       └── browse-files/      # File browser HTMX responses
├── src/                       # Shared utilities
│   ├── core/                  # Platform utilities (config, URL, storage)
│   ├── commerce/              # Commerce API integration
│   └── htmx/                  # Frontend response utilities
├── web-src/                   # Static frontend assets
│   └── src/
│       ├── js/
│       │   ├── core/          # Auto-generated config and URL modules
│       │   ├── htmx/          # HTMX setup and configuration
│       │   └── ui/            # UI components and interactions
│       └── config/
│           └── generated/     # Build-generated configuration files
├── config/                    # Environment configurations
└── app.config.yaml           # Adobe App Builder configuration
```

### **Action Patterns**

#### **Backend Actions** (`actions/backend/`)

Handle data processing, API integration, and business logic.

```javascript
// Example: actions/backend/get-products/index.js
const { Core } = require('@adobe/aio-sdk');

async function main(params) {
  // 1. Initialize Adobe I/O SDK logger
  const logger = Core.Logger('get-products', { level: params.LOG_LEVEL });

  try {
    // 2. Validate input parameters
    validateInput(params);

    // 3. Perform business logic
    const products = await fetchProductsFromCommerce(params);

    // 4. Return standardized response
    return {
      statusCode: 200,
      body: {
        success: true,
        data: products,
      },
    };
  } catch (error) {
    logger.error('Product fetch failed', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: error.message,
      },
    };
  }
}

exports.main = main;
```

#### **Frontend Actions** (`actions/frontend/`)

Generate HTML responses for HTMX dynamic updates.

```javascript
// Example: actions/frontend/browse-files/index.js
const { createHTMXResponse } = require('../../src/htmx/responses');

async function main(params) {
  try {
    const files = await getFileList(params);
    const html = generateFileListHTML(files);

    return createHTMXResponse({
      html,
      target: '#file-browser',
      trigger: 'files:loaded',
    });
  } catch (error) {
    return createHTMXResponse({
      html: '<div class="error">Unable to load files</div>',
      status: 500,
    });
  }
}

exports.main = main;
```

## Configuration Management

### **app.config.yaml**

Main configuration file for Adobe App Builder applications.

```yaml
# Adobe App Builder application configuration
application:
  actions: actions
  web: web-src
  runtimeManifest:
    packages:
      kukla-integration-service:
        license: Apache-2.0
        actions:
          # Backend actions
          get-products:
            function: actions/backend/get-products/index.js
            web: 'yes'
            runtime: nodejs:18
            inputs:
              LOG_LEVEL: debug
            annotations:
              require-adobe-auth: false
              final: true

          # Frontend actions
          browse-files:
            function: actions/frontend/browse-files/index.js
            web: 'yes'
            runtime: nodejs:18
            inputs:
              LOG_LEVEL: debug

# Environment-specific configurations
hooks:
  post-app-run: adobe-app-builder-template

# Static web hosting
web:
  src: web-src
  injected:
    - name: ACTION_URL_GET_PRODUCTS
      value: $ADOBE_IO_RUNTIME_ACTIONS_URL/get-products
```

### **Environment Configuration**

Environment-specific settings in `config/environments/`.

```javascript
// config/environments/staging.json
{
  "commerce": {
    "baseUrl": "https://staging-commerce.example.com",
    "timeout": 30000,
    "rateLimit": {
      "requests": 100,
      "window": 60000
    }
  },
  "files": {
    "maxSize": 10485760,
    "allowedTypes": ["image/*", "text/*", "application/json"]
  },
  "logging": {
    "level": "debug",
    "structured": true
  }
}
```

## Development Workflow

### **Staging-First Development**

Adobe App Builder uses a staging-first development approach:

```bash
# Quick development iteration
npm start
# ↳ Generates frontend config and URLs
# ↳ Builds and deploys to staging
# ↳ Opens browser to staging URL
# ↳ Watches for file changes

# Reliable deployment
npm run deploy
# ↳ Generates frontend assets
# ↳ Full build and validation
# ↳ Deploy to staging workspace

# Production deployment
npm run deploy:prod
# ↳ Deploy to production workspace
```

### **Action Testing**

```bash
# Test individual actions
npm run test:action -- actions/backend/get-products

# Test with parameters
npm run test:action -- actions/backend/get-products --param category=electronics

# Performance testing
npm run perf:test -- actions/backend/get-products
```

## Platform Services Integration

### **Adobe I/O Files SDK**

```javascript
// File operations using Adobe I/O Files
const { Files } = require('@adobe/aio-sdk');

async function uploadFile(fileBuffer, fileName) {
  try {
    const files = await Files.init();
    const result = await files.write(fileName, fileBuffer);
    return result;
  } catch (error) {
    throw new FileOperationError('Upload failed', error);
  }
}

async function downloadFile(fileName) {
  try {
    const files = await Files.init();
    const stream = await files.createReadStream(fileName);
    return stream;
  } catch (error) {
    throw new FileOperationError('Download failed', error);
  }
}
```

### **Adobe I/O State SDK**

```javascript
// State management for session data
const { State } = require('@adobe/aio-sdk');

async function saveUserSession(userId, sessionData) {
  try {
    const state = await State.init();
    await state.put(`session:${userId}`, sessionData);
  } catch (error) {
    throw new StateError('Session save failed', error);
  }
}

async function getUserSession(userId) {
  try {
    const state = await State.init();
    return await state.get(`session:${userId}`);
  } catch (error) {
    throw new StateError('Session retrieval failed', error);
  }
}
```

## Security and Authentication

### **Adobe I/O Authentication**

```javascript
// Action with Adobe authentication
const { Core } = require('@adobe/aio-sdk');

async function main(params) {
  // Validate Adobe I/O authentication token
  const token = params.__ow_headers?.authorization;
  if (!token) {
    return {
      statusCode: 401,
      body: { error: 'Authentication required' },
    };
  }

  try {
    // Verify token with Adobe I/O
    const auth = await Core.Auth.validateToken(token);

    // Use authenticated user context
    const result = await performSecureOperation(auth.user);

    return {
      statusCode: 200,
      body: result,
    };
  } catch (error) {
    return {
      statusCode: 403,
      body: { error: 'Invalid authentication' },
    };
  }
}
```

### **Input Validation**

```javascript
// Secure input validation
const Joi = require('joi');

const productSchema = Joi.object({
  categoryId: Joi.string()
    .pattern(/^[0-9]+$/)
    .required(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  format: Joi.string().valid('json', 'csv').default('json'),
});

function validateInput(params) {
  const { error, value } = productSchema.validate(params);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }
  return value;
}
```

## Performance Optimization

### **Caching Strategies**

```javascript
// Cache expensive Commerce API calls
const { State } = require('@adobe/aio-sdk');

async function getCachedProducts(categoryId) {
  const cacheKey = `products:${categoryId}`;
  const state = await State.init();

  // Try cache first
  const cached = await state.get(cacheKey);
  if (cached && !isCacheExpired(cached.timestamp)) {
    return cached.data;
  }

  // Fetch from Commerce API
  const products = await fetchProductsFromCommerce(categoryId);

  // Cache for future requests
  await state.put(
    cacheKey,
    {
      data: products,
      timestamp: Date.now(),
    },
    { ttl: 300 }
  ); // 5 minutes

  return products;
}
```

### **Streaming for Large Responses**

```javascript
// Stream large file downloads
async function streamLargeFile(params) {
  const { Files } = require('@adobe/aio-sdk');
  const files = await Files.init();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${params.fileName}"`,
    },
    body: files.createReadStream(params.fileName),
  };
}
```

## Monitoring and Logging

### **Structured Logging**

```javascript
// Use Adobe I/O SDK logging
const { Core } = require('@adobe/aio-sdk');

async function main(params) {
  const logger = Core.Logger('action-name', {
    level: params.LOG_LEVEL || 'info',
  });

  logger.info('Action started', {
    requestId: params.__ow_requestId,
    userId: params.userId,
  });

  try {
    const result = await performOperation(params);

    logger.info('Action completed', {
      duration: Date.now() - startTime,
      resultSize: JSON.stringify(result).length,
    });

    return result;
  } catch (error) {
    logger.error('Action failed', {
      error: error.message,
      stack: error.stack,
      params: sanitizeParams(params),
    });
    throw error;
  }
}
```

### **Performance Metrics**

```javascript
// Track action performance
class PerformanceTracker {
  constructor(actionName, logger) {
    this.actionName = actionName;
    this.logger = logger;
    this.startTime = Date.now();
  }

  markStep(stepName) {
    const elapsed = Date.now() - this.startTime;
    this.logger.debug('Performance step', {
      action: this.actionName,
      step: stepName,
      elapsed,
    });
  }

  complete(result) {
    const totalTime = Date.now() - this.startTime;
    this.logger.info('Action performance', {
      action: this.actionName,
      totalTime,
      resultSize: JSON.stringify(result).length,
    });
  }
}
```

## Error Handling

### **Custom Error Classes**

```javascript
// Adobe App Builder specific errors
class AdobeIOError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'AdobeIOError';
    this.code = code;
    this.context = context;
  }
}

class CommerceIntegrationError extends AdobeIOError {
  constructor(message, commerceResponse) {
    super(message, 'COMMERCE_ERROR', { commerceResponse });
    this.name = 'CommerceIntegrationError';
  }
}

class FileOperationError extends AdobeIOError {
  constructor(message, operation, fileName) {
    super(message, 'FILE_ERROR', { operation, fileName });
    this.name = 'FileOperationError';
  }
}
```

### **Graceful Error Recovery**

```javascript
// Implement retry logic for transient failures
async function withRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function isRetryableError(error) {
  return (
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    (error.response && error.response.status >= 500)
  );
}
```

## Deployment and CI/CD

### **Environment Promotion**

```bash
# Deploy to staging
npm run deploy

# Validate in staging
npm run test:staging

# Promote to production
npm run deploy:prod
```

### **Automated Testing**

```javascript
// Integration tests for actions
describe('get-products action', () => {
  test('should export products successfully', async () => {
    const params = {
      categoryId: '123',
      format: 'json',
      LOG_LEVEL: 'error',
    };

    const result = await getProducts.main(params);

    expect(result.statusCode).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data).toBeDefined();
  });
});
```

## Related Documentation

- **[Project Overview](../getting-started/overview.md)** - High-level project context
- **[Development Setup](../getting-started/setup.md)** - Environment configuration
- **[HTMX Integration](htmx-integration.md)** - Frontend architecture
- **[Commerce Integration](commerce-integration.md)** - API integration patterns
- **[Coding Standards](../development/coding-standards.md)** - Code quality guidelines

---

_This guide covers Adobe App Builder platform concepts and patterns used in the Commerce integration service._
