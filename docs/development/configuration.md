# Configuration System Guide

> **Complete guide to the configuration system for Adobe App Builder development**

## Overview

The project uses a sophisticated configuration system with consistent patterns between backend and frontend while maintaining security boundaries. The system automatically generates environment-specific configuration and excludes sensitive data from frontend code.

## Architecture

### Backend Configuration

**Location**: `config/`

- `config/index.js` - Main configuration loader
- `config/environments/` - Environment-specific settings (staging.js, production.js)
- `config/base.js` - Base configuration patterns
- `config/schema/` - Configuration validation schemas

### Frontend Configuration

**Location**: `web-src/src/js/core/config.js` + `web-src/src/config/generated/config.js`

- Auto-generated from backend configuration during build
- Excludes sensitive credentials for security
- Only includes settings actively used by frontend code

## Backend Configuration Usage

### Loading Configuration

```javascript
const { loadConfig } = require('../../config');

async function main(params) {
  // Load complete configuration with environment detection
  const config = loadConfig(params);

  // Access configuration sections
  const commerceUrl = config.commerce.baseUrl;
  const timeout = config.performance.timeout;
  const storageProvider = config.storage.provider;
}
```

### Key Principles

1. **Environment Detection**: Uses `params.NODE_ENV` from Adobe I/O Runtime
2. **Credential Handling**: Credentials come from `.env` → `app.config.yaml` → `params`
3. **No Optional Chaining**: Trust the configuration system - no `?.` or fallbacks needed
4. **Environment Split**: URLs in environment config, credentials in `.env`

### Configuration Sections

```javascript
const config = loadConfig(params);

// Commerce integration
config.commerce.baseUrl; // Environment-specific Commerce URL
config.commerce.timeout; // API timeout settings
config.commerce.paths; // API endpoint paths

// Storage configuration
config.storage.provider; // 's3' or 'app-builder'
config.storage.s3.bucket; // S3 bucket name
config.storage.csv.chunkSize; // CSV processing settings

// Runtime settings
config.runtime.namespace; // Adobe I/O Runtime namespace
config.runtime.package; // Application package name
config.runtime.paths; // URL path structure

// Performance settings
config.performance.timeout; // Request timeouts
config.performance.tracing; // Logging and tracing config
```

## Frontend Configuration Usage

### Loading Configuration

```javascript
import {
  loadConfig,
  getRuntimeConfig,
  getPerformanceConfig,
  getTimeout,
  isStaging,
  isProduction,
} from './core/config.js';

// Load complete frontend configuration
const config = loadConfig();

// Access specific sections
const runtime = getRuntimeConfig();
const performance = getPerformanceConfig();

// Environment detection
if (isStaging()) {
  console.log('Running in staging environment');
}

// Get specific values
const timeout = getTimeout(); // Used by HTMX
```

### Available Functions

```javascript
// Core functions
loadConfig(); // Complete frontend configuration
getConfig(); // Alias for loadConfig()

// Section-specific functions
getRuntimeConfig(); // Runtime settings and action mappings
getPerformanceConfig(); // Performance and timeout settings

// Environment functions
getEnvironment(); // Current environment name
isStaging(); // Check if staging environment
isProduction(); // Check if production environment

// Convenience functions
getActions(); // Available action mappings
getTimeout(); // HTMX timeout configuration
```

### Frontend Configuration Structure

```javascript
// Generated frontend configuration (security-filtered)
{
  environment: "staging",

  runtime: {
    package: "kukla-integration-service",
    version: "v1",
    baseUrl: "https://adobeioruntime.net",
    namespace: "285361-188maroonwallaby-stage",
    paths: { base: "/api", web: "/web" },
    actions: {
      "get-products": "get-products",
      "download-file": "download-file",
      "browse-files": "browse-files",
      "delete-file": "delete-file"
    }
  },

  performance: {
    timeout: 30000,
    maxExecutionTime: 30000
  }
}
```

## Configuration Generation

### Build Integration

Frontend configuration is automatically generated during build:

```bash
npm run build:config    # Generate config only
npm run start          # Generate config + deploy
npm run build          # Generate config + build
npm run deploy         # Generate config + deploy
```

### Generation Process

1. **Script**: `scripts/generate-frontend.js` (consolidated config and URL generation)
2. **Source**: Loads backend configuration using `loadConfig()`
3. **Filtering**: Excludes sensitive credentials (Commerce, AWS, etc.)
4. **Output**:
   - `web-src/src/config/generated/config.js` (ES6 module)
   - `web-src/src/js/core/url.js` (auto-generated URL functions)
5. **Security**: Generated files excluded from version control

### Consolidated Frontend Generation

The system now generates both configuration and URL modules in a single script:

```javascript
// Generated configuration module
export const CONFIG = {
  environment: 'staging',
  runtime: {
    /* runtime settings */
  },
  performance: {
    /* performance settings */
  },
};

// Generated URL module with backend-equivalent functions
export function getActionUrl(action, params) {
  // Auto-generated from backend buildRuntimeUrl logic
}

export function getDownloadUrl(fileName, path) {
  // Consistent with backend URL patterns
}
```

This eliminates code duplication and ensures frontend URL building matches backend patterns exactly.

### Environment-Specific Generation

```bash
NODE_ENV=staging npm run build:config    # Generate staging config
NODE_ENV=production npm run build:config # Generate production config
```

## Security Model

### Backend vs Frontend Data

**Backend (Complete)**:

```javascript
{
  commerce: {
    baseUrl: "https://demo.com",
    credentials: {
      username: "admin",      // ✅ Backend only
      password: "secret"      // ✅ Backend only
    }
  }
}
```

**Frontend (Filtered)**:

```javascript
{
  // Commerce credentials completely excluded
  runtime: {
    baseUrl: "https://demo.com", // ✅ Safe for frontend
    timeout: 30000              // ✅ Safe for frontend
  }
}
```

### Credential Handling

**NEVER** include credentials in frontend configuration:

- Commerce username/password excluded
- AWS access keys excluded
- Database credentials excluded
- API keys excluded

**DO** include safe operational data:

- API endpoints and URLs
- Timeout settings
- Environment names
- Feature flags

## Adobe I/O Runtime Parameter Handling

### Environment Variables vs Action Parameters

**NEVER** access credentials via `process.env` in Adobe I/O Runtime actions. Use this pattern:

1. **Local `.env` file**: `AWS_ACCESS_KEY_ID=your_key`
2. **`app.config.yaml` inputs**: `AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID`
3. **Action function**: Access via `params.AWS_ACCESS_KEY_ID`

```javascript
// ✅ CORRECT: Use action parameters
async function main(params) {
  const accessKey = params.AWS_ACCESS_KEY_ID; // From app.config.yaml inputs
  const username = params.COMMERCE_ADMIN_USERNAME; // From app.config.yaml inputs
}

// ❌ WRONG: Don't use process.env in actions
async function main(params) {
  const accessKey = process.env.AWS_ACCESS_KEY_ID; // Will be undefined!
}
```

### Required Steps for New Credentials

1. Add to `.env`: `NEW_CREDENTIAL=value`
2. Add to `app.config.yaml` inputs: `NEW_CREDENTIAL: $NEW_CREDENTIAL`
3. Access in action: `params.NEW_CREDENTIAL`
4. Use `extractActionParams()` from `src/core/http/client` to process parameters

## Commerce Configuration Pattern

### Configuration Split

1. **Commerce URL**: Always from environment configuration (`config/environments/staging.js` or `production.js`)

   - Path: `config.commerce.baseUrl`
   - Loaded via: `loadConfig(params)`

2. **Commerce Credentials**: Always from `.env` file
   - `COMMERCE_ADMIN_USERNAME=admin`
   - `COMMERCE_ADMIN_PASSWORD=password`
   - Passed via `app.config.yaml` inputs to actions

```javascript
// ✅ CORRECT: Commerce configuration pattern
async function main(params) {
  const config = loadConfig(params);
  const commerceUrl = config.commerce.baseUrl; // From environment config
  const username = params.COMMERCE_ADMIN_USERNAME; // From .env via params
  const password = params.COMMERCE_ADMIN_PASSWORD; // From .env via params
}
```

## Integration Examples

### URL Management Integration

```javascript
// Backend
const { buildRuntimeUrl } = require('../../src/core/url');
const config = loadConfig(params);
const actionUrl = buildRuntimeUrl('get-products', null, params);

// Frontend
import { getActionUrl } from './core/url.js';
const actionUrl = getActionUrl('get-products');
```

### HTMX Integration

```javascript
// HTMX setup uses configuration
import { getTimeout } from '../core/config.js';

const HTMX_CONFIG = {
  timeout: getTimeout(), // From performance configuration
  // ... other settings
};
```

### Action Integration

```javascript
// Actions use configuration consistently
const { loadConfig, extractActionParams } = require('../../config');

async function main(params) {
  const actionParams = extractActionParams(params);
  const config = loadConfig(actionParams);

  // Use configuration throughout action
  const commerceUrl = config.commerce.baseUrl;
  const timeout = config.performance.timeout;
}
```

## Best Practices

### Configuration Access

- **Use specific functions**: `getRuntimeConfig()` instead of `loadConfig().runtime`
- **Trust the system**: No optional chaining or fallbacks in business logic
- **Cache automatically**: Configuration functions handle caching internally

### Frontend Development

- **Environment checks**: Use `isStaging()`, `isProduction()` for environment-specific behavior
- **Dynamic config**: Configuration regenerated on each build for each environment
- **Security awareness**: Never include credentials in frontend code

### Backend Development

- **Parameter pattern**: Use `params.VARIABLE_NAME` for credentials, not `process.env`
- **Environment split**: URLs in environment config, credentials in `.env`
- **Validation trust**: Configuration is pre-validated, no need for defensive checks

## Scripts Integration

### Current Scripts

- **`generate-frontend.js`** - Generates frontend configuration and URL modules from backend config
- **`test-action.js`** - Test individual actions with configuration
- **`test-api.js`** - API testing utilities
- **`test-performance.js`** - Performance testing with configuration

All scripts integrate with the configuration system and support staging/production environment detection.

## Troubleshooting

### Configuration Not Found

```bash
npm run build:config  # Regenerate frontend configuration
```

### Environment Issues

```bash
NODE_ENV=staging npm run build:config     # Force staging config
NODE_ENV=production npm run build:config  # Force production config
```

### Missing Credentials

1. Check `.env` file has required variables
2. Verify `app.config.yaml` inputs reference environment variables
3. Ensure action parameters receive credentials via inputs

### Frontend Import Errors

```javascript
// ❌ Wrong: Importing from non-existent config
import { urlConfig } from '../config/url';

// ✅ Correct: Using configuration system
import { getRuntimeConfig } from './core/config.js';
```

## Related Documentation

- **[URL Management](url-management.md)** - URL building patterns
- **[HTMX Integration](../architecture/htmx-integration.md)** - Frontend integration
- **[Commerce Integration](../architecture/commerce-integration.md)** - Commerce configuration
- **[Testing Guide](testing.md)** - Testing with configuration
- **[Deployment Configuration](../deployment/configuration.md)** - Deployment and infrastructure config

## Configuration Override System

The system uses a consolidated approach for handling configuration overrides:

```javascript
// Define configuration overrides in config/index.js
const configOverrides = {
  'commerce.baseUrl': 'COMMERCE_BASE_URL',
  'commerce.credentials.username': 'COMMERCE_ADMIN_USERNAME',
  // ... other overrides
};

// Apply overrides automatically
applyConfigOverrides(config, params, configOverrides);
```

### Key Features

1. **Single Source of Truth**: All overrides defined in one mapping object
2. **Automatic Nesting**: Paths like 'commerce.credentials.username' automatically create nested objects
3. **Precedence**: Adobe I/O Runtime parameters take priority over environment variables
4. **Default Values**: All defaults live in environment configuration files

### Usage Pattern

```javascript
// In actions/your-action/index.js
const { loadConfig } = require('../../../config');

async function main(params) {
  const config = loadConfig(params);
  // config.commerce.baseUrl is automatically set from:
  // 1. params.COMMERCE_BASE_URL (if exists)
  // 2. process.env.COMMERCE_BASE_URL (if exists)
  // 3. environment config default
}
```

### Adding New Configuration

To add a new configurable value:

1. Add default in `config/environments/[staging|production].js`
2. Add override mapping in `config/index.js` if needed:

   ```javascript
   const configOverrides = {
     'your.config.path': 'YOUR_ENV_VAR_NAME'
   };
   ```

### Development vs Production

- Development: Use `loadValidatedConfig()` for schema validation
- Production: Use `loadConfig()` for performance
- Testing: Configuration auto-loads in test scripts

## Security Considerations

- Credentials always flow: `.env` → `app.config.yaml` → action parameters
- Frontend configuration excludes all sensitive data
- Environment-specific values stay in environment config files
- No credentials in code or version control

---

_This configuration system provides a secure, maintainable foundation for the Adobe App Builder Commerce integration project._
