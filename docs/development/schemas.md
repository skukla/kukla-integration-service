# Schema Validation Guide

This guide covers the simplified schema validation system that serves as **build-time quality assurance** for our Adobe App Builder application.

## Overview

The schema system provides **development-time validation** without runtime overhead:

- **Build Integration**: Automatically validates configuration before deployment
- **Fail Fast**: Catches configuration errors before they reach production
- **Zero Runtime Impact**: Production actions use fast `loadConfig()` without validation
- **Smart Output**: Concise for builds, detailed for development

### Schema Components

- **Core Configuration Schema**: Validates the main configuration structure
- **API Action Schemas**: Validates request/response for each action
- **Frontend Configuration Schema**: Validates generated frontend configuration
- **Validation Utilities**: Helper functions for common validation tasks

## Usage Patterns

### Build Integration (Recommended)

Schema validation is automatically integrated into all build and deployment commands:

```bash
# All these commands include schema validation
npm run build      # validate → build:config → build
npm run start      # validate → build:config → deploy
npm run deploy     # clean → validate → build:config → deploy

# Direct validation
npm run validate   # Concise output for build integration
```

**Build Output:**

```bash
> npm run deploy
✅ Schema validation passed    # ← Concise, clean output
✅ Generated frontend (Staging)
✔ Deployed 4 action(s) for 'application'
Successful deployment 🏄
```

### Development Testing

For detailed validation during development:

```bash
npm run test:schemas    # Detailed output with full diagnostics
```

**Development Output:**

```bash
🚀 Starting schema validation tests...
🧪 Testing configuration validation...
✅ Configuration loaded successfully
✅ Configuration validation passed
[... detailed test results ...]
🎉 All schema tests passed!
```

### Error Handling

When validation fails, detailed error information is always provided:

```bash
❌ Schema validation failed (1/4 tests failed)
❌ Configuration validation failed: data/performance/tracing/errorVerbosity must be equal to one of the allowed values
```

The build process **stops** on validation failure, preventing deployment of invalid configuration.

## Schema Files

### Core Schemas

- `config/schema/core.schema.js` - Main configuration validation
- `config/schema/api.schema.js` - Action request/response validation
- `config/schema/index.js` - Schema exports and validation functions

### Deprecated Schemas

Old complex schemas have been moved to `config/schema/deprecated/` for reference but are no longer used.

## Configuration Validation

### Basic Usage

```javascript
const { loadConfig, loadValidatedConfig } = require('../config');

// Load configuration without validation
const config = loadConfig();

// Load configuration with validation
const validatedConfig = loadValidatedConfig();

// Manual validation
const { validateConfig } = require('../config/schema');
validateConfig(config);
```

### Configuration Structure

The schema validates this structure:

```javascript
{
  environment: 'staging' | 'production',
  products: {
    fields: string[],
    batchSize: number,
    perPage: number,
    maxTotal: number
  },
  categories: {
    batchSize: number,
    cacheTimeout: number,
    retries: number,
    retryDelay: number
  },
  commerce: {
    baseUrl: string (URI),
    timeout: number,
    retries: number,
    retryDelay: number,
    paths: object,
    auth: object,
    batching: object,
    caching: object,
    credentials: object // Added at runtime
  },
  storage: {
    provider: 's3' | 'app-builder',
    csv: object,
    s3: object
  },
  runtime: {
    package: string,
    version: string,
    baseUrl: string (URI),
    namespace: string,
    paths: object
  },
  performance: {
    maxExecutionTime: number,
    maxMemoryUsage: number,
    maxErrorRate: number,
    tracing: object
  },
  testing: {
    timeout: number,
    retries: number,
    logLevel: string,
    scenarios: object
  }
}
```

## Action Validation

### Available Actions

Schemas are available for:

- `get-products`
- `browse-files`
- `download-file`
- `delete-file`

### Parameter Validation

```javascript
const { validateActionParams } = require('../src/shared/validation');

// Non-strict validation (warns on failure)
const isValid = validateActionParams('get-products', params);

// Strict validation (throws on failure)
try {
  validateActionParams('get-products', params, { strict: true });
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### Response Validation

```javascript
const { validateActionResponse } = require('../src/shared/validation');

// Validate action response
const isValid = validateActionResponse('get-products', response);
```

### Request Schema Structure

All actions expect these base parameters:

```javascript
{
  // Adobe I/O Runtime parameters
  __ow_method: string,
  __ow_headers: object,
  __ow_path: string,
  __ow_user: string,
  __ow_body: string,

  // Environment
  NODE_ENV: 'staging' | 'production',

  // Credentials (from app.config.yaml)
  COMMERCE_ADMIN_USERNAME: string,
  COMMERCE_ADMIN_PASSWORD: string,
  AWS_ACCESS_KEY_ID: string,
  AWS_SECRET_ACCESS_KEY: string
}
```

Action-specific parameters:

- **get-products**: `category`, `limit`, `fields`
- **download-file/delete-file**: `fileName`, `fullPath`

### Response Schema Structure

Standard success response:

```javascript
{
  statusCode: number,
  headers: {
    'Content-Type': string,
    'Access-Control-Allow-Origin': string,
    'Access-Control-Allow-Methods': string,
    'Access-Control-Allow-Headers': string
  },
  body: {
    success: true,
    message: string,
    steps: string[],
    downloadUrl?: string,
    storage?: {
      provider: 's3' | 'app-builder',
      location: string,
      properties: object
    }
  }
}
```

Standard error response:

```javascript
{
  statusCode: number,
  headers: object,
  body: {
    success: false,
    error: string,
    details?: string
  }
}
```

## Frontend Configuration Validation

### Generated Configuration

The frontend generation script validates the generated configuration:

```javascript
const { validateFrontendConfig } = require('../config/schema');

// Validate generated frontend config
validateFrontendConfig(frontendConfig);
```

### Frontend Schema Structure

```javascript
{
  environment: 'staging' | 'production',
  runtime: {
    package: string,
    version: string,
    baseUrl: string (URI),
    namespace: string,
    paths: {
      base: string,
      web: string
    },
    actions: {
      'get-products': string,
      'browse-files': string,
      'download-file': string,
      'delete-file': string
    }
  },
  performance: {
    timeout: number,
    maxExecutionTime: number
  }
}
```

## Validation Utilities

### Simple Validation Helpers

```javascript
const {
  checkMissingRequestInputs,
  validateRequired,
  validateString,
  validateUrl,
} = require('../src/shared/validation');

// Check for missing parameters
const error = checkMissingRequestInputs(params, ['username', 'password']);

// Validate required fields
validateRequired(data, ['name', 'email']);

// Validate string
validateString(value, 'username');

// Validate URL
validateUrl(value, 'baseUrl');
```

### Schema-Based Validation

```javascript
const { getActionSchema } = require('../config/schema');

// Get schema for specific action
const schema = getActionSchema('get-products');

if (schema) {
  // Use schema for validation
  console.log('Request schema:', schema.request);
  console.log('Response schema:', schema.response);
}
```

## Testing Schemas

### Test Script

Run the schema test suite:

```bash
npm run test:schemas
```

This tests:

- Configuration validation
- Frontend configuration validation
- Action schema validation
- Invalid configuration handling

### Manual Testing

```javascript
const { validateConfig, getActionSchema } = require('../config/schema');
const { validateActionParams } = require('../src/shared/validation');

// Test configuration
const config = require('../config/environments/staging');
validateConfig(config);

// Test action parameters
const params = {
  NODE_ENV: 'staging',
  COMMERCE_ADMIN_USERNAME: 'admin',
  COMMERCE_ADMIN_PASSWORD: 'password',
};
validateActionParams('get-products', params, { strict: true });
```

## Integration with Build Process

### Frontend Generation

The frontend generation script automatically validates generated configuration:

```bash
npm run build:config
```

This runs validation and warns if the generated configuration doesn't match the schema.

### Configuration Loading

Use validated configuration loading in actions:

```javascript
const { loadValidatedConfig } = require('../config');

// This will validate configuration and warn on issues
const config = loadValidatedConfig(params);
```

## Schema Design Principles

### Simplified Structure

- Matches actual configuration structure
- No complex nested validation rules
- Focuses on what's actually used

### Optional Validation

- Validation is opt-in, not required
- Warns instead of failing for compatibility
- Strict mode available when needed

### Action-Specific

- Each action has its own request/response schema
- Schemas match actual Adobe I/O Runtime patterns
- Includes Adobe I/O Runtime metadata

### Frontend Security

- Frontend schema excludes all credentials
- Only includes safe operational data
- Validates generated configuration structure

## Migration from Old Schemas

### What Changed

- Removed complex nested validation rules
- Simplified to match actual configuration structure
- Moved unused schemas to `deprecated/` folder
- Added action-specific validation

### Backward Compatibility

- Simple validation functions remain the same
- Configuration loading is backward compatible
- Validation is optional by default

### Updating Code

Old pattern:

```javascript
const { validateInput } = require('../src/core/data/validation');
```

New pattern:

```javascript
const { validateRequired } = require('../src/shared/validation');
// or
const { validateActionParams } = require('../src/shared/validation');
```

## Best Practices

### When to Use Validation

- **Always**: In test scripts and development tools
- **Optional**: In production actions (for performance)
- **Required**: For frontend configuration generation

### Error Handling

```javascript
// Non-strict: Log warnings, continue execution
const isValid = validateActionParams(action, params);
if (!isValid) {
  console.warn('Parameter validation failed');
}

// Strict: Throw errors, halt execution
try {
  validateActionParams(action, params, { strict: true });
} catch (error) {
  return response.error(error.message);
}
```

### Schema Updates

When adding new configuration:

1. Update the appropriate schema file
2. Add validation tests
3. Update this documentation
4. Test with `npm run test:schemas`

## Troubleshooting

### Common Issues

**"No schema found for action"**

- Check that the action name matches exactly
- Verify the action is defined in `api.schema.js`

**"Configuration validation failed"**

- Check the configuration structure matches the schema
- Look for missing required fields
- Verify data types (string vs number)

**"Frontend configuration validation failed"**

- Check the generated configuration structure
- Verify all required runtime fields are present
- Check that actions are properly mapped

### Debug Mode

Enable detailed validation errors:

```javascript
// Use strict mode for detailed error messages
validateActionParams(action, params, { strict: true });
```

### Schema Inspection

```javascript
const { core, api } = require('../config/schema');

// Inspect core configuration schema
console.log(JSON.stringify(core, null, 2));

// Inspect action schemas
console.log(JSON.stringify(api.actions, null, 2));
```
