# Configuration Guide

## Overview

This document describes the configuration system used in the application. The configuration is organized into several categories, each with its own schema validation and default values. The system supports environment-specific overrides and secure handling of sensitive data.

## Configuration Structure

```text
config/
├── environments/           # Environment-specific configuration
│   ├── development.js     # Development environment settings
│   ├── staging.js         # Staging environment settings
│   └── production.js      # Production environment settings
├── schema/                # JSON Schema definitions
│   ├── app.schema.js      # Application settings schema
│   ├── url.schema.js      # URL patterns schema
│   ├── commerce.schema.js # Commerce API schema
│   └── security.schema.js # Security settings schema
├── defaults/              # Default configuration values
│   ├── app.defaults.js    # Default application settings
│   ├── url.defaults.js    # Default URL patterns
│   ├── commerce.defaults.js # Default commerce settings
│   └── security.defaults.js # Default security settings
└── index.js              # Configuration entry point
```

## Configuration Categories

### App Configuration

Controls application-wide settings including:
- Runtime environment and feature flags
- Logging configuration
- Performance monitoring settings
- Storage and file handling

Example:
```javascript
{
  runtime: {
    environment: 'development',
    features: {
      debugLogging: true
    }
  },
  logging: {
    level: 'debug',
    format: 'text'
  }
}
```

### URL Configuration

Defines URL patterns and routing for:
- API endpoints
- Frontend routes
- Environment-specific base URLs
- Path templates

Example:
```javascript
{
  api: {
    baseUrl: 'http://localhost:3000',
    version: 'v1'
  },
  frontend: {
    baseUrl: 'http://localhost:8080'
  }
}
```

### Commerce Configuration

Manages Adobe Commerce integration settings:
- API timeouts and retry logic
- Batch processing configuration
- Caching policies
- Endpoint definitions

Example:
```javascript
{
  api: {
    timeout: 30000,
    retry: {
      attempts: 3,
      delay: 1000
    },
    batch: {
      size: 50
    }
  }
}
```

### Security Configuration

Controls security-related settings:
- Authentication configuration
- Authorization rules
- Rate limiting
- API key management
- Encryption settings

Example:
```javascript
{
  authentication: {
    commerce: {
      type: 'token',
      tokenRefresh: {
        enabled: true
      }
    }
  },
  rateLimit: {
    enabled: true,
    windowMs: 900000,
    max: 100
  }
}
```

## Environment-Specific Configuration

The system supports different configurations for development, staging, and production environments:

1. Development
   - Enhanced logging and debugging
   - Longer timeouts for debugging
   - Disabled caching
   - Relaxed security settings

2. Staging
   - Moderate logging
   - Balanced performance settings
   - Short-term caching
   - Semi-strict security

3. Production
   - Minimal logging
   - Optimized performance
   - Aggressive caching
   - Strict security settings

## Usage

```javascript
const { loadConfig } = require('../config');

// Load configuration
const config = loadConfig();

// Access configuration values
const { commerce, security } = config;
const timeout = commerce.api.timeout;
const authType = security.authentication.commerce.type;
```

## Configuration Validation

All configuration is validated using JSON Schema:

1. Schema files define the structure and constraints
2. Validation occurs during configuration loading
3. Type checking and constraint validation
4. Helpful error messages for invalid configuration

## Best Practices

1. Environment Variables
   - Use .env for sensitive data
   - Never commit credentials
   - Use placeholder values in examples

2. Configuration Updates
   - Document all changes
   - Update schema when adding fields
   - Maintain backward compatibility
   - Test configuration changes

3. Security
   - Separate sensitive configuration
   - Use environment variables
   - Validate all inputs
   - Follow least privilege principle

4. Performance
   - Cache configuration where appropriate
   - Minimize configuration file size
   - Use reasonable defaults
   - Monitor configuration impact

## Troubleshooting

Common issues and solutions:

1. Schema Validation Errors
   - Check against schema requirements
   - Verify data types
   - Ensure required fields are present

2. Environment Issues
   - Verify NODE_ENV setting
   - Check environment file exists
   - Validate environment variables

3. Security Concerns
   - Review credential handling
   - Check permission settings
   - Verify rate limit configuration

## Migration Guide

When updating from previous versions:

1. Backup existing configuration
2. Review schema changes
3. Update environment files
4. Test configuration loading
5. Verify application behavior 