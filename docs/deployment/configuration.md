# Configuration Management

> **Environment configuration and schema validation for Adobe App Builder applications**
>
> **⚠️ Important**: This guide covers deployment and infrastructure configuration. For **practical development patterns**, see **[Development Configuration Guide](../development/configuration.md)** which has the **current working patterns**.

## Overview

This guide describes the configuration system used in the Adobe App Builder Commerce integration service. The configuration supports environment-specific settings, schema validation, and secure handling of sensitive data.

**Note**: Some patterns in this deployment guide may be outdated. For current, working configuration patterns used in the codebase, refer to the **[Development Configuration Guide](../development/configuration.md)**.

## Configuration Structure

```text
config/
├── environments/              # Environment-specific configuration
│   ├── .env.example          # Template for environment variables
│   ├── staging.js            # Staging environment settings
│   └── production.js         # Production environment settings
├── schema/                   # JSON Schema definitions
│   ├── app.schema.js         # Application settings schema
│   ├── commerce.schema.js    # Commerce API schema
│   └── security.schema.js    # Security settings schema
├── defaults/                 # Default configuration values
│   ├── app.defaults.js       # Default application settings
│   ├── commerce.defaults.js  # Default commerce settings
│   └── security.defaults.js  # Default security settings
└── app-config.js            # Configuration entry point
```

## Environment Variables

### **Required Variables**

Create a `.env` file in `config/environments/` based on `.env.example`:

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
NODE_ENV=staging  # development, staging, production
LOG_LEVEL=debug   # debug, info, warn, error

# Security Configuration
SESSION_SECRET=your-session-secret-key
CSRF_SECRET=your-csrf-secret-key

# Feature Flags
ENABLE_DEBUG_MODE=true
ENABLE_PERFORMANCE_MONITORING=false
ENABLE_CACHE=true

# File Storage Configuration
FILES_STORAGE_PREFIX=kukla-integration
FILES_MAX_SIZE=10485760  # 10MB in bytes
FILES_ALLOWED_TYPES=image/*,text/*,application/json,application/csv
```

### **Optional Variables**

```bash
# Performance Configuration
COMMERCE_TIMEOUT=30000
COMMERCE_RETRY_ATTEMPTS=3
COMMERCE_RETRY_DELAY=1000

# Cache Configuration
CACHE_TTL=300  # 5 minutes
CACHE_MAX_SIZE=1000

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
PERFORMANCE_SAMPLING_RATE=0.1
ERROR_REPORTING_ENABLED=true
```

## Configuration Categories

### **Application Configuration**

Controls application-wide settings including runtime environment, feature flags, and performance monitoring.

```javascript
// config/defaults/app.defaults.js
module.exports = {
  runtime: {
    environment: 'development',
    timeout: 30000,
    retries: 3,
  },
  logging: {
    level: 'info',
    format: 'json',
    structured: true,
  },
  features: {
    debugMode: false,
    performanceMonitoring: true,
    errorReporting: true,
  },
  performance: {
    maxConcurrentRequests: 10,
    requestTimeout: 30000,
    memoryThreshold: 512,
  },
};
```

### **Commerce Configuration**

Manages Adobe Commerce integration settings including API timeouts, retry logic, batch processing, and caching policies.

```javascript
// config/defaults/commerce.defaults.js
module.exports = {
  api: {
    baseUrl: process.env.COMMERCE_BASE_URL,
    timeout: 30000,
    version: 'rest/V1',
    retry: {
      attempts: 3,
      delay: 1000,
      backoff: 'exponential',
    },
  },
  authentication: {
    type: 'token',
    tokenRefresh: {
      enabled: true,
      threshold: 300, // 5 minutes before expiry
    },
  },
  batch: {
    size: 50,
    concurrency: 5,
    delay: 100,
  },
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 1000,
  },
  rateLimit: {
    enabled: true,
    requests: 100,
    window: 60000, // 1 minute
  },
};
```

### **Security Configuration**

Controls security-related settings including authentication, authorization, rate limiting, and encryption.

```javascript
// config/defaults/security.defaults.js
module.exports = {
  authentication: {
    required: true,
    sessionTimeout: 3600000, // 1 hour
    cookieSecure: true,
    cookieSameSite: 'strict',
  },
  authorization: {
    enableRBAC: true,
    defaultRole: 'user',
    adminRoles: ['admin', 'super-admin'],
  },
  rateLimit: {
    enabled: true,
    windowMs: 900000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP',
  },
  cors: {
    enabled: true,
    origins: ['https://your-domain.com'],
    credentials: true,
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotation: {
      enabled: true,
      interval: 86400000, // 24 hours
    },
  },
};
```

## Environment-Specific Configuration

### **Development Configuration**

```javascript
// config/environments/development.js
module.exports = {
  runtime: {
    environment: 'development',
    timeout: 60000, // Longer timeout for debugging
  },
  logging: {
    level: 'debug',
    format: 'text', // Easier to read during development
  },
  commerce: {
    api: {
      timeout: 60000,
      retry: { attempts: 1 }, // No retries during development
    },
    cache: { enabled: false }, // Disable cache for development
  },
  security: {
    rateLimit: { enabled: false }, // No rate limiting during development
    cors: { origins: ['http://localhost:3000'] },
  },
  features: {
    debugMode: true,
    performanceMonitoring: false,
  },
};
```

### **Staging Configuration**

```javascript
// config/environments/staging.js
module.exports = {
  runtime: {
    environment: 'staging',
    timeout: 30000,
  },
  logging: {
    level: 'debug',
    format: 'json',
  },
  commerce: {
    api: {
      timeout: 30000,
      retry: { attempts: 2 },
    },
    cache: { enabled: true, ttl: 180 }, // 3 minutes
  },
  security: {
    rateLimit: {
      enabled: true,
      max: 200, // More lenient for testing
    },
  },
  features: {
    debugMode: true,
    performanceMonitoring: true,
  },
};
```

### **Production Configuration**

```javascript
// config/environments/production.js
module.exports = {
  runtime: {
    environment: 'production',
    timeout: 15000, // Shorter timeout for production
  },
  logging: {
    level: 'info',
    format: 'json',
  },
  commerce: {
    api: {
      timeout: 15000,
      retry: { attempts: 3 },
    },
    cache: { enabled: true, ttl: 300 }, // 5 minutes
  },
  security: {
    rateLimit: {
      enabled: true,
      max: 100, // Strict rate limiting
    },
    cors: { origins: ['https://your-production-domain.com'] },
  },
  features: {
    debugMode: false,
    performanceMonitoring: true,
    errorReporting: true,
  },
};
```

## Configuration Loading

### **Configuration Entry Point**

```javascript
// config/app-config.js
const { loadEnvironmentConfig, validateConfig } = require('./loader');
const appDefaults = require('./defaults/app.defaults');
const commerceDefaults = require('./defaults/commerce.defaults');
const securityDefaults = require('./defaults/security.defaults');

class ConfigManager {
  constructor() {
    this.config = null;
    this.environment = process.env.NODE_ENV || 'development';
  }

  loadConfig() {
    if (this.config) {
      return this.config;
    }

    // Load default configuration
    const defaults = {
      ...appDefaults,
      commerce: commerceDefaults,
      security: securityDefaults,
    };

    // Load environment-specific overrides
    const envConfig = loadEnvironmentConfig(this.environment);

    // Merge configurations (environment overrides defaults)
    this.config = this.mergeConfig(defaults, envConfig);

    // Validate final configuration
    validateConfig(this.config);

    return this.config;
  }

  mergeConfig(defaults, overrides) {
    // Deep merge configuration objects
    return this.deepMerge(defaults, overrides);
  }

  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  getConfig() {
    return this.loadConfig();
  }

  get(path) {
    const config = this.getConfig();
    return this.getNestedValue(config, path);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

module.exports = new ConfigManager();
```

### **Usage in Actions**

```javascript
// actions/backend/get-products/index.js
const config = require('../../../config/app-config');

async function main(params) {
  // Get full configuration
  const appConfig = config.getConfig();

  // Get specific configuration values
  const commerceTimeout = config.get('commerce.api.timeout');
  const logLevel = config.get('logging.level');
  const cacheEnabled = config.get('commerce.cache.enabled');

  // Use configuration
  const commerceClient = new CommerceClient({
    baseUrl: appConfig.commerce.api.baseUrl,
    timeout: commerceTimeout,
    retries: appConfig.commerce.api.retry.attempts,
  });

  // ... rest of action logic
}
```

## Configuration Validation

### **Schema Definitions**

```javascript
// config/schema/app.schema.js
const Joi = require('joi');

module.exports = Joi.object({
  runtime: Joi.object({
    environment: Joi.string().valid('development', 'staging', 'production').required(),
    timeout: Joi.number().integer().min(1000).max(300000).required(),
  }).required(),

  logging: Joi.object({
    level: Joi.string().valid('debug', 'info', 'warn', 'error').required(),
    format: Joi.string().valid('text', 'json').required(),
  }).required(),

  features: Joi.object({
    debugMode: Joi.boolean().required(),
    performanceMonitoring: Joi.boolean().required(),
  }).required(),
});
```

```javascript
// config/schema/commerce.schema.js
const Joi = require('joi');

module.exports = Joi.object({
  api: Joi.object({
    baseUrl: Joi.string().uri().required(),
    timeout: Joi.number().integer().min(1000).max(60000).required(),
    retry: Joi.object({
      attempts: Joi.number().integer().min(0).max(10).required(),
      delay: Joi.number().integer().min(100).max(10000).required(),
    }).required(),
  }).required(),

  cache: Joi.object({
    enabled: Joi.boolean().required(),
    ttl: Joi.number().integer().min(60).max(3600).required(),
  }).required(),
});
```

### **Configuration Validation**

```javascript
// config/validator.js
const appSchema = require('./schema/app.schema');
const commerceSchema = require('./schema/commerce.schema');
const securitySchema = require('./schema/security.schema');

function validateConfig(config) {
  // Validate application configuration
  const { error: appError } = appSchema.validate(config);
  if (appError) {
    throw new Error(`Application configuration error: ${appError.message}`);
  }

  // Validate commerce configuration
  const { error: commerceError } = commerceSchema.validate(config.commerce);
  if (commerceError) {
    throw new Error(`Commerce configuration error: ${commerceError.message}`);
  }

  // Validate security configuration
  const { error: securityError } = securitySchema.validate(config.security);
  if (securityError) {
    throw new Error(`Security configuration error: ${securityError.message}`);
  }

  // Custom validation rules
  validateCustomRules(config);
}

function validateCustomRules(config) {
  // Ensure production has strict security settings
  if (config.runtime.environment === 'production') {
    if (config.features.debugMode) {
      throw new Error('Debug mode must be disabled in production');
    }

    if (!config.security.rateLimit.enabled) {
      throw new Error('Rate limiting must be enabled in production');
    }
  }

  // Ensure cache is enabled for performance
  if (config.runtime.environment !== 'development' && !config.commerce.cache.enabled) {
    console.warn('Warning: Cache is disabled in non-development environment');
  }
}

module.exports = { validateConfig };
```

## Configuration Best Practices

### **1. Environment Variables**

```bash
# Use descriptive names with prefixes
COMMERCE_BASE_URL=https://example.com
COMMERCE_TIMEOUT=30000

# Group related variables
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Use consistent naming conventions
ENABLE_DEBUG_MODE=true  # Boolean flags
FILES_MAX_SIZE=10485760  # Numeric values
```

### **2. Security Considerations**

```javascript
// Never log sensitive configuration
const sanitizedConfig = {
  ...config,
  commerce: {
    ...config.commerce,
    api: {
      ...config.commerce.api,
      accessToken: '[REDACTED]',
    },
  },
};
logger.info('Configuration loaded', sanitizedConfig);

// Validate required secrets exist
const requiredSecrets = ['COMMERCE_ACCESS_TOKEN', 'SESSION_SECRET'];
for (const secret of requiredSecrets) {
  if (!process.env[secret]) {
    throw new Error(`Required secret ${secret} is not set`);
  }
}
```

### **3. Performance Optimization**

```javascript
// Cache configuration after loading
let cachedConfig = null;

function getConfig() {
  if (!cachedConfig) {
    cachedConfig = loadAndValidateConfig();
  }
  return cachedConfig;
}

// Use configuration for performance tuning
const config = getConfig();
const httpClient = new HttpClient({
  timeout: config.commerce.api.timeout,
  retries: config.commerce.api.retry.attempts,
  concurrency: config.performance.maxConcurrentRequests,
});
```

### **4. Configuration Testing**

```javascript
// Test configuration loading in different environments
describe('Configuration', () => {
  test('should load development configuration', () => {
    process.env.NODE_ENV = 'development';
    const config = loadConfig();

    expect(config.logging.level).toBe('debug');
    expect(config.features.debugMode).toBe(true);
  });

  test('should validate production configuration', () => {
    process.env.NODE_ENV = 'production';
    process.env.COMMERCE_ACCESS_TOKEN = 'test-token';

    expect(() => loadConfig()).not.toThrow();
  });

  test('should reject invalid configuration', () => {
    const invalidConfig = { runtime: { environment: 'invalid' } };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });
});
```

## Troubleshooting

### **Common Configuration Issues**

1. **Missing Environment Variables**

   ```bash
   # Check if variables are set
   echo $COMMERCE_BASE_URL
   echo $COMMERCE_ACCESS_TOKEN

   # Load from .env file
   source config/environments/.env.staging
   ```

2. **Schema Validation Errors**

   ```bash
   # Test configuration validation
   npm run test:config

   # Check specific schema
   node -e "
   const config = require('./config/app-config');
   console.log(JSON.stringify(config.getConfig(), null, 2));
   "
   ```

3. **Environment-Specific Issues**

   ```bash
   # Force specific environment
   NODE_ENV=staging npm start

   # Debug configuration loading
   DEBUG=config:* npm start
   ```

## Related Documentation

- **[Deployment Guide](environments.md)** - Environment setup and deployment
- **[Development Setup](../getting-started/setup.md)** - Initial configuration
- **[Security Practices](security.md)** - Security configuration guidelines
- **[Adobe App Builder Architecture](../architecture/adobe-app-builder.md)** - Platform configuration

---

_This configuration guide covers environment management, schema validation, and best practices for Adobe App Builder applications._
