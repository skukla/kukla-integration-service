# Configuration Audit

## Current Configuration Files

### 1. Environment Variables (.env)

- **Purpose**: Sensitive configuration and credentials
- **Contents**:
    - Commerce API credentials
    - Adobe I/O Runtime credentials
    - Service API keys
    - IMS configuration
- **Used By**: Backend actions and deployment
- **Issues**:
    - Sensitive data mixed with non-sensitive configuration
    - No validation of required values
    - No type checking
    - No environment-specific overrides

### 2. App Builder Configuration (app.config.yaml)

- **Purpose**: Action configuration and runtime settings
- **Contents**:
    - Action definitions
    - Runtime configurations
    - Input/parameter definitions
    - Web export settings
- **Used By**: App Builder deployment
- **Issues**:
    - No validation of environment variables
    - Duplicate configuration of runtime versions
    - Mixed concerns (deployment vs runtime)

### 3. Frontend Configuration (web-src/src/config.json)

- **Purpose**: Frontend API endpoint configuration
- **Contents**: API endpoint URLs for local development
- **Used By**: Frontend application
- **Issues**:
    - Hardcoded URLs
    - No environment switching
    - No integration with urls.js
    - Manual updates required

### 4. URL Configuration (config/urls.js)

- **Purpose**: Environment-specific URL management
- **Contents**: Base URLs for different environments
- **Used By**: Backend services
- **Issues**:
    - Not used by frontend
    - No validation
    - Limited environment support
    - No URL pattern management

### 5. Performance Configuration

- **Purpose**: Performance testing and baselines
- **Contents**:
    - Test configuration (test-performance.js)
    - Baseline metrics (baseline-metrics.json)
- **Used By**: Performance testing suite
- **Issues**:
    - Mixed configuration and data
    - No environment-specific baselines
    - Manual baseline updates

## Consolidation Plan

### 1. Create Unified Configuration Structure

```text
config/
├── environments/           # Environment-specific configuration
│   ├── development.js     # Development environment
│   ├── staging.js         # Staging environment
│   └── production.js      # Production environment
├── schema/                # Configuration schemas
│   ├── app.schema.js      # App configuration schema
│   ├── api.schema.js      # API configuration schema
│   └── url.schema.js      # URL configuration schema
├── defaults/              # Default configuration
│   ├── app.defaults.js    # Default app settings
│   └── api.defaults.js    # Default API settings
└── index.js              # Configuration entry point
```

### 2. Configuration Categories

1. **App Configuration**
   - Runtime settings
   - Feature flags
   - Logging levels
   - Performance thresholds

2. **API Configuration**
   - Endpoint definitions
   - Timeout settings
   - Retry policies
   - Rate limits

3. **Security Configuration**
   - API keys (via .env)
   - Authentication settings
   - Authorization rules
   - Security policies

4. **URL Configuration**
   - Base URLs
   - URL patterns
   - Path templates
   - Query parameter schemas

### 3. Implementation Steps

1. **Schema Definition**
   - Define JSON schemas for all configuration
   - Add validation rules
   - Document all options
   - Add TypeScript types

2. **Environment Management**
   - Create environment-specific overrides
   - Add validation per environment
   - Implement secure credential handling
   - Add environment detection

3. **Integration**
   - Update frontend to use new config
   - Update actions to use new config
   - Add configuration testing
   - Add migration utilities

4. **Documentation**
   - Add configuration guides
   - Document all options
   - Add validation rules
   - Include examples

## Migration Strategy

1. **Phase 1: Schema Creation**
   - Create JSON schemas
   - Add TypeScript types
   - Document all options
   - Add validation rules

2. **Phase 2: New Structure**
   - Create new directory structure
   - Add environment configs
   - Create default configs
   - Add validation

3. **Phase 3: Integration**
   - Update frontend config
   - Update action configs
   - Add migration utilities
   - Update documentation

4. **Phase 4: Testing**
   - Add config validation tests
   - Test environment switching
   - Validate all options
   - Test error cases

## Next Steps

1. Create JSON schemas for configuration
2. Set up new configuration structure
3. Create environment-specific configurations
4. Update application to use new configuration
5. Add validation and testing
