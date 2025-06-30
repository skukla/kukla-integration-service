# Adobe App Builder - Kukla Integration Service

## Project Overview

This is an Adobe App Builder application that integrates with Adobe Commerce for product data management and file operations. The project uses a staging-first development approach with HTMX for frontend interactions.

## Architecture & Technology Stack

- **Platform**: Adobe App Builder (Node.js serverless)
- **Frontend**: HTMX with vanilla JavaScript
- **Backend**: Adobe I/O Runtime actions
- **Commerce**: Adobe Commerce integration
- **File Storage**: Adobe I/O Files SDK
- **Build Tool**: Adobe I/O CLI
- **Deployment**: Staging and Production workspaces

## Code Style & Standards

- Use ES6+ JavaScript features
- Follow Adobe's coding standards
- Use async/await for promises
- Prefer functional programming patterns
- Use JSDoc for function documentation
- Follow the existing project structure

### Configuration Approach

**CRITICAL: Trust the Configuration System**

Use clean, direct object access for configuration:

```javascript
// ✅ CORRECT: Clean and readable
const config = loadConfig(params);
const timeout = config.commerce.api.timeout;
const { pageSize, maxPages } = config.commerce.product.pagination;
const fields = config.commerce.product.fields;

// ❌ WRONG: Verbose with defensive fallbacks
const timeout = config.commerce?.api?.timeout || 30000;
const pageSize = config.commerce?.product?.pagination?.pageSize || 100;
```

**Rules:**

- NO optional chaining (`?.`) in business logic
- NO fallback values (`|| defaultValue`) in business logic
- Defaults belong in config files, not scattered through code
- Trust your configuration system to provide complete data

## Project Structure Rules

- **actions/**: Backend serverless functions
  - `backend/`: API endpoints and data processing
  - `frontend/`: HTMX response handlers
- **src/**: Shared utilities and core logic
  - `core/`: Common utilities
  - `htmx/`: HTMX-specific helpers
  - `commerce/`: Adobe Commerce integration
- **web-src/**: Frontend static assets
- **config/**: Environment and schema configurations
- **docs/**: Comprehensive documentation

## Development Guidelines

### Always Start with Context

Before implementing any feature:

1. Check existing utilities in `src/core/` first
2. Review similar patterns in `actions/backend/` or `actions/frontend/`
3. Consult relevant documentation in `docs/`
4. Verify the configuration system in `config/`

### Adobe App Builder Specific

- All backend code goes in `actions/` as Adobe I/O Runtime functions
- Use Adobe I/O SDK features (@adobe/aio-sdk)
- Leverage Adobe I/O Files for file operations
- Use environment-specific configurations from `config/environments/`
- Follow staging-first development workflow

### Command Line Operations

**CRITICAL: Always Prefer npm Scripts**

Use npm scripts instead of direct CLI commands for consistency and integration:

```bash
# ✅ CORRECT: Use npm scripts
npm run deploy          # Deploy to staging
npm run deploy:prod     # Deploy to production
npm run deploy:mesh     # Update API Mesh
npm run test:action     # Test individual actions
npm run build:config    # Generate frontend configuration

# ❌ WRONG: Direct CLI commands
aio app deploy
aio api-mesh update mesh.json
aio rt activation logs
```

**npm Scripts Benefits:**
- **Consistency**: Same commands work across environments
- **Integration**: Automatically handles build steps and validation
- **Documentation**: Scripts are self-documenting in package.json
- **Workflow**: Integrates with IDE and CI/CD systems

### Command Line Operations

**CRITICAL: Always Prefer npm Scripts**

Use npm scripts instead of direct CLI commands for consistency and integration:

```bash
# ✅ CORRECT: Use npm scripts
npm run deploy          # Deploy to staging
npm run deploy:prod     # Deploy to production
npm run deploy:mesh     # Update API Mesh
npm run test:action     # Test individual actions
npm run build:config    # Generate frontend configuration

# ❌ WRONG: Direct CLI commands
aio app deploy
aio api-mesh update mesh.json
aio rt activation logs
```

**npm Scripts Benefits:**
- **Consistency**: Same commands work across environments
- **Integration**: Automatically handles build steps and validation
- **Documentation**: Scripts are self-documenting in package.json
- **Workflow**: Integrates with IDE and CI/CD systems

### HTMX Integration

- Use HTMX attributes for dynamic UI updates
- Keep JavaScript minimal and progressive enhancement focused
- Use the established HTMX utilities in `src/htmx/`
- Ensure graceful fallbacks when JavaScript is disabled

### Commerce Integration

**CRITICAL: OAuth 1.0 Authentication**

All Commerce API calls use OAuth 1.0 authentication with HMAC-SHA256 signatures:

```javascript
// ✅ CORRECT: Use makeCommerceRequest for OAuth authentication
const { makeCommerceRequest } = require('../../../src/commerce/api/integration');

const response = await makeCommerceRequest('/products', {
  method: 'GET',
}, params); // params contains OAuth credentials

// ✅ CORRECT: OAuth credentials in app.config.yaml inputs
COMMERCE_CONSUMER_KEY: $COMMERCE_CONSUMER_KEY
COMMERCE_CONSUMER_SECRET: $COMMERCE_CONSUMER_SECRET
COMMERCE_ACCESS_TOKEN: $COMMERCE_ACCESS_TOKEN
COMMERCE_ACCESS_TOKEN_SECRET: $COMMERCE_ACCESS_TOKEN_SECRET

// ❌ WRONG: Don't create custom OAuth implementations
// ❌ WRONG: Don't test authentication separately - let API calls validate
```

**OAuth Implementation Rules:**

- **Always use `makeCommerceRequest()`** for Commerce API calls
- **Never implement custom OAuth** - use the established `createOAuthHeader()` function
- **No pre-authentication testing** - OAuth validation happens during actual API calls
- **Parameter extraction** - Use `extractActionParams()` to get OAuth credentials from action parameters
- **URL handling** - Use `buildCommerceUrl()` for proper Commerce API URL construction
- **Signature generation** - Follows Postman-style base URL parsing for HMAC-SHA256 signatures

**Required OAuth Credentials:**

All actions that call Commerce APIs must have these inputs in `app.config.yaml`:
- `COMMERCE_CONSUMER_KEY`
- `COMMERCE_CONSUMER_SECRET` 
- `COMMERCE_ACCESS_TOKEN`
- `COMMERCE_ACCESS_TOKEN_SECRET`

**Commerce Integration Guidelines:**

- Use the established Commerce utilities in `src/commerce/`
- Handle Commerce API rate limits appropriately
- Validate product data according to Commerce schemas
- Use proper error handling for Commerce API calls
- Always use OAuth 1.0 for authentication (no legacy admin token auth)

### API Mesh Integration

**CRITICAL: JavaScript Compatibility**

API Mesh JavaScript parser has compatibility limitations:

```javascript
// ✅ CORRECT: String concatenation for API Mesh resolvers
const inventoryUrl = 'https://example.com/rest/V1/stockItems/' + sku;
const message = 'Successfully fetched ' + count + ' products';

// ❌ WRONG: Template literals not fully supported in API Mesh
const inventoryUrl = `https://example.com/rest/V1/stockItems/${sku}`;
const message = `Successfully fetched ${count} products`;
```

**CRITICAL: Storage Dependency Pattern**

Always use `storeCsv()` function with correct parameters to avoid circular dependency issues:

```javascript
// ✅ CORRECT: Use storeCsv function (handles storage initialization internally)
const storeCsv = require('../get-products/steps/storeCsv');

const storageResult = await storeCsv(csvData, actionParams);

// Check for storage errors
if (!storageResult.stored) {
  throw new Error(`Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`);
}

// ❌ WRONG: Manual storage initialization in actions
const { initializeStorage } = require('../../../src/core/storage');
const storage = await initializeStorage(config, actionParams); // Circular dependency!

// ❌ WRONG: Incorrect storeCsv parameters
await storeCsv(csvData, config, storage); // Wrong - 3 params instead of 2
```

**Storage Error Handling Rules:**

- **Always check `storageResult.stored`** - Don't assume storage succeeded
- **Use proper error messages** - Include specific error details when storage fails
- **Let storeCsv handle initialization** - Don't manually initialize storage in actions
- **Correct function signature** - `storeCsv(csvData, actionParams)` only (2 parameters)
- **Test script display** - Storage errors show as "Storage Failed" not "ERROR"

**API Mesh Patterns:**

- Use `mesh.json` for API Mesh configuration with CommonJS format resolvers
- Custom resolvers in `mesh-resolvers.js` to consolidate multiple data sources
- Enhanced resolvers bridge gaps between Commerce REST API and Catalog Service
- **True Mesh Pattern**: Mesh resolvers consolidate data from multiple Commerce APIs into single GraphQL query
- Pass OAuth credentials via admin token headers (`x-commerce-admin-token`) for mesh authentication
- Pass Catalog Service credentials via custom headers (`x-catalog-*`)
- Catalog Service authentication requires Commerce instance endpoint, not sandbox
- API Mesh consolidates 200+ API calls into single GraphQL queries
- Enhanced resolvers expose hidden/disabled products not visible in Catalog Service

**API Mesh Limitations:**

- External GraphQL schema files not supported in `additionalTypeDefs` (unlike `additionalResolvers`)
- Type definitions must be inline in `mesh.json` as string array for better readability
- Keep external `.graphql` files for documentation but reference inline definitions

**Required Configuration:**

- Mesh endpoint and API key in environment configuration
- Catalog Service credentials in `.env` and `app.config.yaml`
- Commerce authentication token passed to mesh resolvers
- Environment-specific mesh configuration (staging/production)

### Error Handling

- Use consistent error response formats
- Log errors appropriately for debugging
- Provide user-friendly error messages
- Follow the error handling patterns in existing code

### Performance

- Use caching where appropriate
- Optimize Commerce API calls
- Consider file size limits for Adobe I/O Files
- Use compression for large responses

### Testing

- Use the existing test scripts (`npm run test:action`)
- Test actions individually before integration
- Use unified performance testing framework (npm run test:perf:*) for optimization and analysis
- Test in staging environment before production

### Performance Testing Framework

**CRITICAL: Use Unified Framework for All Performance Testing**

Always use the comprehensive performance framework instead of creating ad-hoc scripts:

```bash
# Preferred: Use unified framework
npm run test:perf:list      # List scenarios
npm run test:perf:compare   # REST vs Mesh comparison
npm run test:perf:mesh      # Detailed analysis
npm run test:perf:batch     # Batch optimization

# WRONG: Don't create separate performance scripts
# node scripts/test-mesh-custom.js  # Avoid this pattern
```

**Performance Testing Rules:**

- **Use existing scenarios**: 8 comprehensive scenarios available (baselines, comparison, analysis, batching)
- **Extend framework**: Add new scenarios to `src/core/testing/performance/scenarios.js` instead of new scripts
- **Baseline tracking**: Framework automatically manages historical performance baselines
- **Clean output**: Professional reporting with proper success/failure detection
- **Error handling**: Framework includes comprehensive error recovery and validation

## Code Quality

- Use ESLint and Prettier (already configured)
- Write clear, self-documenting code
- Add JSDoc comments for public functions
- Use meaningful variable and function names
- Handle edge cases and errors gracefully

## Security

- Never commit credentials or secrets
- Use environment variables for sensitive data
- Validate all inputs
- Follow Adobe's security best practices
- Use the security guidelines in `docs/security.md`

## Deployment

- Use `npm start` for quick development iteration
- Use `npm run deploy` for reliable staging deployment
- Use `npm run deploy:prod` for production
- Always test in staging before production deployment

## Context-Aware Development

When helping with this project:

1. **Reference actual files**: Always check what exists in the current directory structure
2. **Follow established patterns**: Use the same coding style and architecture patterns found in existing files
3. **Maintain consistency**: Keep the same error handling, logging, and response formats
4. **Use existing utilities**: Don't recreate functionality that already exists in `src/core/`
5. **Update documentation**: When adding features, update relevant docs in `docs/`

## Memory Substitutes (Manual Context)

Since automatic memories aren't available, use these manual techniques:

- **Reference previous solutions**: "Like the pattern in actions/backend/get-products.js..."
- **Point to documentation**: "Following the security guidelines in docs/security.md..."
- **Use project structure**: "Create a new utility in src/core/ that can be shared..."
- **Include version context**: "This is an Adobe App Builder project using staging-first development..."

## Action Architecture & DRY Principles

### CRITICAL: Reuse Step Functions

**NEVER** recreate functionality that exists in step functions. Always reuse established patterns:

```javascript
// ✅ CORRECT: Reuse existing step functions
const buildProducts = require('../get-products/steps/buildProducts');
const createCsv = require('../get-products/steps/createCsv');
const storeCsv = require('../get-products/steps/storeCsv');
const validateInput = require('../get-products/steps/validateInput');

// Use formatStepMessage for consistent messaging
const { formatStepMessage } = require('../../../src/core/utils');

// ❌ WRONG: Recreating CSV generation, file storage, step messaging manually
```

### Action Structure Pattern

All backend actions should follow this consistent structure:

1. **Import shared step functions** from `/steps/` directories
2. **Extract and validate parameters** with `extractActionParams()`
3. **Use consistent step messaging** with `formatStepMessage()`
4. **Reuse transformation logic** (`buildProducts`, `createCsv`, `storeCsv`)
5. **Only create new logic** for data fetching (e.g., `fetchProductsFromMesh`)

### Step Function Guidelines

**Always Reuse:**

- `validateInput()` - Input validation
- `buildProducts()` - Product data transformation  
- `createCsv()` - CSV generation with proper headers
- `storeCsv()` - File storage logic
- `formatStepMessage()` - Consistent step messaging
- `response.success/error()` - Response formatting

**Only Create New:**

- Data fetching functions (e.g., `fetchProductsFromMesh` vs `fetchAndEnrichProducts`)
- Source-specific transformations

### Parity Requirements

Actions that serve the same purpose (e.g., `get-products` vs `get-products-mesh`) must have:

- ✅ **Identical step messages** - Same success/error formatting
- ✅ **Identical CSV structure** - Same headers, filename, download URLs
- ✅ **Identical response format** - Same storage, performance, message fields
- ✅ **Shared business logic** - Reuse transformations, validations, file operations

## When Making Changes

1. **Check existing step functions** in `actions/*/steps/` before creating new ones
2. **Reuse shared utilities** in `src/core/` before creating new ones
3. Follow the configuration system for new settings
4. Update documentation when adding features
5. Test with the provided test scripts
6. Use staging environment for development
7. Consider HTMX patterns for UI interactions
8. **Maintain architectural consistency** across similar actions

## Configuration Management

The application uses a sophisticated configuration system across backend and frontend with consistent patterns and security considerations.

### Backend Configuration

Use `loadConfig(params)` and the configuration override system:

```javascript
const { loadConfig } = require('../../config');

// Load complete configuration
const config = loadConfig(params);

// Configuration is automatically overridden from:
// 1. Action parameters (params.VARIABLE_NAME)
// 2. Environment variables (process.env.VARIABLE_NAME)
// 3. Environment config defaults
```

### Configuration Override Pattern

Use the `configOverrides` mapping in `config/index.js`:

```javascript
const configOverrides = {
  'commerce.baseUrl': 'COMMERCE_BASE_URL',
  'commerce.credentials.username': 'COMMERCE_ADMIN_USERNAME'
};

// Automatically creates nested objects and applies overrides
applyConfigOverrides(config, params, configOverrides);
```

### Configuration Rules

- **Backend**: Use `loadConfig(params)` for complete configuration
- **Frontend**: Use specialized functions like `getCommerceConfig()`
- **Security**: Never include credentials in frontend configuration
- **Environment**: Configuration automatically detects staging vs production
- **Build process**: Frontend config regenerated on each build/deploy
- **Legacy**: Old `urlConfig` imports should use new `core/config.js`

### Configuration Generation

Frontend configuration is automatically generated during build from backend config:

- **Build integration**: `npm run build:config` generates frontend config
- **Security**: Sensitive credentials excluded from frontend
- **Environment-specific**: Generated config matches build environment
- **Auto-generated**: File at `web-src/src/config/generated/config.js`

## URL Management

The application uses a consistent URL management system across backend and frontend contexts:

### Backend URL Building

Use `src/core/routing/index.js` which re-exports from `src/core/url/index.js`:

```javascript
const { buildRuntimeUrl, buildCommerceUrl } = require('../../src/core/routing');

// Runtime action URLs
const actionUrl = buildRuntimeUrl('get-products', null, params);

// Commerce API URLs
const commerceUrl = buildCommerceUrl(config.commerce.baseUrl, 'products');
```

### Frontend URL Building

Use `web-src/src/js/core/url.js` directly:

```javascript
import { getActionUrl, getDownloadUrl, buildDownloadUrl } from '../core/url.js';

// Action URLs
const browseUrl = getActionUrl('browse-files');

// File URLs
const downloadUrl = getDownloadUrl('products.csv', '/exports/');
```

### URL Management Rules

- **Backend**: Always use `buildRuntimeUrl()` for action URLs
- **Frontend**: Always use `getActionUrl()` for action URLs
- **Commerce**: Always use `buildCommerceUrl()` for Commerce API URLs
- **Parameters**: Use the built-in parameter encoding, don't encode manually
- **Environment**: URL building automatically detects staging vs production
- **HTMX**: System handles relative vs absolute URLs automatically

### Key Functions

**Backend:**

- `buildRuntimeUrl(action, customBaseUrl, params)` - Build action URLs
- `buildCommerceUrl(baseUrl, path, pathParams)` - Build Commerce URLs
- `buildActionUrl(config, action, options)` - Core URL building (internal)

**Frontend:**

- `getActionUrl(action, params)` - Get action URL with parameters
- `getDownloadUrl(fileName, path)` - Get file download URL
- `buildDownloadUrl(filePath)` - Build encoded download URL
- `getConfig()` - Get URL configuration for debugging

## Schema Validation System

### Build-Time Quality Assurance

The project uses schema validation as **build tooling** that provides development-time validation without runtime overhead:

- **Build Integration**: Automatically validates configuration before deployment
- **Fail Fast**: Catches configuration errors before they reach production  
- **Zero Runtime Impact**: Production actions use fast `loadConfig()` without validation
- **Smart Output**: Concise for builds, detailed for development

### Schema Components

- **Core Configuration Schema** (`config/schema/core.schema.js`): Validates main configuration structure
- **API Action Schemas** (`config/schema/api.schema.js`): Validates request/response for each action
- **Frontend Configuration Schema**: Validates generated frontend configuration with security filtering

### Build Integration (Automatic)

Schema validation is **automatically integrated** into all build and deployment commands:

- **npm run build** - Validates before building
- **npm run start** - Validates before quick deployment  
- **npm run deploy** - Validates before staging deployment
- **npm run deploy:prod** - Validates before production deployment

### Output Modes

- **Build Integration**: `npm run validate` - Concise output ("✅ Schema validation passed")
- **Development**: `npm run test:schemas` - Detailed diagnostics  
- **Failure**: Always shows detailed error messages regardless of mode

### Usage Patterns

```javascript
// Runtime: Fast loading without validation (recommended)
const config = loadConfig(params);

// Development: Validated loading (warns only)
const config = loadValidatedConfig(params);

// Testing: Strict validation
const { validateActionParams } = require('../src/core/validation');
validateActionParams('get-products', params, { strict: true });
```

### Validation Flow

```
npm run deploy
├── npm run validate (schema validation - concise)
├── npm run build:config (frontend generation)
└── aio app deploy (deployment)
```

### Build Failure Handling

When validation fails, build stops with detailed errors:

```
❌ Schema validation failed (1/4 tests failed)
❌ Configuration validation failed: errorVerbosity must be equal to one of the allowed values
```

## Common Patterns

- Configuration: Use the schema-validated config system
- File Operations: Use Adobe I/O Files SDK through existing utilities
- Commerce API: Use established Commerce integration patterns
- Frontend Updates: Use HTMX for dynamic content
- Error Responses: Use consistent error formatting
- Logging: Use appropriate log levels and formatting
- URL Building: Use the established URL management functions
- API Mesh: Always use True Mesh pattern with embedded resolvers
- **CRITICAL - Data Transformation**: NEVER transform data in mesh resolvers - always use buildProducts step
- **CRITICAL - Mesh Actions**: NEVER skip buildProducts step - always use it for consistency  
- **CRITICAL - Raw Data**: Mesh resolvers should return raw consolidated data, not transformed data

## Dependencies

- Prefer using existing dependencies over adding new ones
- Use Adobe SDK features when available
- Keep dependencies updated and secure
- Document any new dependency requirements

## Conversation Context Helpers

To help maintain context across conversations:

- Always mention this is an "Adobe App Builder Commerce integration project"
- Reference the staging-first development workflow when discussing deployment
- Point to existing documentation when relevant
- Use the project structure terminology consistently
- Reference the existing test scripts when discussing testing

## Adobe I/O Runtime Parameter Handling

### CRITICAL: Environment Variables vs Action Parameters

**NEVER** access credentials or configuration via `process.env` in Adobe I/O Runtime actions. Adobe I/O Runtime uses a specific pattern:

#### The Correct Pattern

1. **Local `.env` file**: `AWS_ACCESS_KEY_ID=your_key`
2. **`app.config.yaml` inputs**: `AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID`
3. **Action function**: Access via `params.AWS_ACCESS_KEY_ID`

#### How It Works

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

#### Required Steps for New Credentials

1. Add to `.env`: `NEW_CREDENTIAL=value`
2. Add to `app.config.yaml` inputs: `NEW_CREDENTIAL: $NEW_CREDENTIAL`
3. Access in action: `params.NEW_CREDENTIAL`
4. Use `extractActionParams()` from `src/core/http/client` to process parameters

#### Why This Matters

- Adobe I/O Runtime passes inputs as action parameters, not environment variables
- The `extractActionParams()` function normalizes and processes these parameters
- Environment variables work locally but fail in deployed actions
- This pattern ensures consistency with existing Commerce credential handling

#### Examples in Codebase

- Commerce credentials: `params.COMMERCE_ADMIN_USERNAME` (working)
- AWS credentials: `params.AWS_ACCESS_KEY_ID` (working)
- Any new credentials should follow this same pattern

## Commerce Configuration Pattern

### CRITICAL: Commerce URL vs Credentials Source

**NEVER** manually specify Commerce URLs or mix configuration sources. Follow this established pattern:

#### The Configuration Split

1. **Commerce URL**: Always from environment configuration (`config/environments/staging.js` or `production.js`)

   - Path: `config.commerce.baseUrl`
   - Loaded via: `loadConfig(params)`
   - Example: `https://citisignal-com774.adobedemo.com`

2. **Commerce Credentials**: Always from `.env` file
   - `COMMERCE_ADMIN_USERNAME=admin`
   - `COMMERCE_ADMIN_PASSWORD=password`
   - Passed via `app.config.yaml` inputs to actions

#### How Actions Handle This

```javascript
// ✅ CORRECT: Commerce configuration pattern
async function main(params) {
  const config = loadConfig(params);
  const commerceUrl = config.commerce.baseUrl; // From environment config
  const username = params.COMMERCE_ADMIN_USERNAME; // From .env via params
  const password = params.COMMERCE_ADMIN_PASSWORD; // From .env via params
}
```

#### Test Script Auto-Loading

The `test-action.js` script automatically handles both:

- Loads Commerce URL from environment configuration
- Loads credentials from `.env` file
- No manual parameter specification needed for get-products

#### Why This Pattern

- **Environment separation**: URLs differ between staging/production
- **Security**: Credentials stay in `.env`, never in code
- **Consistency**: Same pattern across all Commerce integrations
- **Auto-detection**: Environment determines the correct URL

## Action Response Structure

### CRITICAL: Test Script Integration

Actions should return structured responses for proper `test-action.js` display:

#### Required Response Fields

```javascript
// ✅ CORRECT: Action response structure
return response.success({
  message: 'Operation completed successfully',
  steps: [
    'Step 1: What was accomplished',
    'Step 2: Include specific data types (e.g., "category and inventory data")',
    'Step 3: Show counts and sizes',
  ],
  downloadUrl: 'https://...', // For file operations
  storage: {
    provider: 'app-builder' | 's3',
    location: 'file/path',
    properties: {
      /* file details */
    },
  },
});
```

#### What Test Script Shows

- **Storage Provider**: `📦 Storage: S3 (bucket-name)` or `📦 Storage: APP-BUILDER (Adobe I/O Files)`
- **Download URL**: Direct link for file operations
- **Numbered Steps**: All execution steps with specific details
- **No Parameters**: Clean output without parameter clutter
- **No Redundant Stats**: Steps contain all necessary information

#### Step Message Guidelines

- Be specific about data types: "category and inventory data"
- Include counts: "119 products"
- Show file sizes: "15.45 KB"
- Use `formatStepMessage()` function for consistency

## Tracing Module Pattern

### CRITICAL: Dynamic Configuration Loading

**NEVER** use undefined global constants in tracing. Always use dynamic configuration:

#### The Correct Pattern

```javascript
// ✅ CORRECT: Dynamic tracing configuration
function createTraceContext(actionName, params) {
  const tracingConfig = getTracingConfig(params);
  const trace = {
    config: tracingConfig, // Store for later use
    // ... other trace properties
  };
}

// ✅ CORRECT: Use stored config
if (context.config.performance.enabled) {
  // performance tracking
}
```

#### Configuration Source

- Path: `config.app.monitoring.tracing`
- Loaded via: `getTracingConfig(params)`
- Always pass params for proper environment detection

### When to Use Validation

- **Always**: In test scripts and development tools (`npm run test:schemas`)
- **Optional**: In production actions (use `loadValidatedConfig()` for warnings)
- **Required**: For frontend configuration generation (automatic validation)

## Debugging & Troubleshooting

### CRITICAL: Handling Unloggable 500 Errors

When an Adobe I/O Runtime action returns a `500 Internal Server Error` but produces **no logs** (`aio rt activation logs <id>` is empty), it indicates a catastrophic, pre-initialization failure. Standard debugging is ineffective. Follow this protocol:

1.  **Inject "Blast" Logging**:
    -   Add a unique `TRACE_ID` constant to the top of the failing action file (e.g., `const TRACE_ID = 'DIAGNOSTIC_TRACE_...'`).
    -   Prepend this `TRACE_ID` to aggressive `console.log` statements at every critical execution step (module load, function entry, before/after API calls).
    -   **Crucially**, modify the final `catch (error)` block to return a custom JSON object, NOT the standard response handler. This ensures a traceable response even if the logging system fails.

    ```javascript
    // ✅ CORRECT: Custom error response for diagnostics
    } catch (error) {
      console.error(`${TRACE_ID}: MAIN_CATCH_BLOCK_ERROR`, error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_source: 'my-failing-action',
          trace_id: TRACE_ID,
          original_error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }),
      };
    }
    ```

2.  **Inspect the Browser Network Response**:
    -   After deploying the "blast-logged" action, trigger it from the UI.
    -   Open the browser's developer tools, go to the Network tab, and inspect the response body of the failed 500 request.
    -   If you see the `trace_id` in the JSON response, your code **is** being deployed and executed. The `original_error` object will contain the true root cause.

3.  **Validate the Entire Build Pipeline**:
    -   The error may not be in the action code itself, but in a file that generates it.
    -   In our case, `mesh-resolvers.template.js` was generating an incorrect `mesh-resolvers.js` file, causing an authentication mismatch.
    -   Always inspect templates, generators, and configuration files (`config/environments/*.js`) as potential root causes.

4.  **The "Scorched Earth" Solution (Last Resort)**:
    -   If an action is irrecoverably broken and unloggable, there may be corrupted state on the platform.
    -   Comment out the entire action definition in `app.config.yaml`.
    -   Run `npm run deploy`. This will delete the action from the runtime.
    -   Uncomment the action definition in `app.config.yaml`.
    -   Run `npm run deploy` again. This will re-provision the action from a clean state.

### CRITICAL: `process.env` Causes Catastrophic Failures

Reinforcing a core principle: **NEVER use `process.env` in any code that runs on Adobe I/O Runtime**.

-   **Symptom**: A `500 Internal Server Error` with no logs.
-   **Cause**: A configuration file (`config/environments/staging.js`) used `apiKey: process.env.MESH_API_KEY`. In the deployed action, `process.env.MESH_API_KEY` was `undefined`, which caused the underlying `fetch` to crash the entire Node.js runtime before logging could initialize.
-   **Solution**: Always pass secrets and configuration as action parameters via `.env` -> `app.config.yaml` -> `params`. The code should then reference `params.MY_VARIABLE`.

## API Mesh Integration Patterns

### CRITICAL: Data Transformation Separation

**NEVER** perform data transformation in mesh resolvers. Always maintain strict separation of concerns:

```javascript
// ✅ CORRECT: Mesh resolver returns RAW consolidated data
// mesh-resolvers.js
const enrichedProduct = {
  ...product,
  qty: inventory.qty,
  categories: categoryObjects, // Raw category objects with id/name
  media_gallery_entries: product.media_gallery_entries, // Raw media data
  inventory: { qty: inventory.qty, is_in_stock: inventory.is_in_stock }
};

// ✅ CORRECT: Action uses buildProducts step for transformation
// actions/backend/get-products-mesh/index.js
const builtProducts = await buildProducts(enrichedProducts, config);

// ❌ WRONG: Mesh resolver doing transformation
enrichedProduct.images = product.media_gallery_entries.map(transformImageEntry);
enrichedProduct.categories = categoryObjects.map(cat => cat.name);

// ❌ WRONG: Action skipping buildProducts
const builtProducts = enrichedProducts; // Skips transformation!
```

**Transformation Responsibility Rules:**

- **Mesh Resolver**: ONLY consolidate raw data from multiple APIs
- **buildProducts Step**: ALWAYS handle data transformation (categories, images, etc.)
- **Actions**: NEVER skip buildProducts step - always use it for consistency
- **Raw Data**: Mesh should return data in same format as Commerce API responses

**Why This Matters:**

- **Code Reuse**: Same transformation logic used by REST API and Mesh methods
- **Consistency**: Identical CSV output guaranteed through shared transformation
- **Maintainability**: Single source of truth for business logic
- **Testing**: One transformation path to test and debug

### CRITICAL: True Mesh Pattern (Current Implementation)

**Our API Mesh implementation uses embedded custom resolvers that consolidate multiple Commerce API calls into a single GraphQL query:**

#### The True Mesh Architecture

```javascript
// ✅ CORRECT: True Mesh Pattern with embedded resolvers
// mesh-resolvers.js (auto-generated from template)
module.exports = {
  resolvers: {
    Query: {
      mesh_products_enriched: {
        resolve: async (parent, args, context) => {
          // Get admin token from headers
          const adminToken = context.headers['x-commerce-admin-token'];
          
          // Step 1: Fetch all products from Commerce API
          const allProducts = await fetchAllProductsFromSource(context, pageSize, maxPages);
          
          // Step 2: Extract category IDs and SKUs
          const categoryIds = new Set();
          const skus = [];
          // ... extraction logic
          
          // Step 3: Fetch category and inventory data in parallel
          const [categoryMap, inventoryMap] = await Promise.all([
            fetchCategoriesFromSource(context, Array.from(categoryIds)),
            fetchInventoryFromSource(context, skus),
          ]);
          
          // Step 4: Return RAW consolidated data (no transformation)
          const enrichedProducts = allProducts.map((product) => ({
            ...product,
            qty: inventory.qty,
            categories: categoryObjects, // Raw objects with id/name
            // Keep media_gallery_entries as-is for buildProducts
          }));
          
          return { products: enrichedProducts, total_count: enrichedProducts.length };
        },
      },
    },
  },
};
```

#### Why True Mesh Pattern

**✅ Benefits:**

- **Consolidates 200+ API calls** into single GraphQL query
- **True unified schema** - single endpoint for all product data
- **Configuration integration** - uses project's configuration system
- **Template generation** - auto-generated with environment-specific settings
- **Raw data consolidation** - lets buildProducts handle transformation
- **Perfect API Mesh integration** - leverages full GraphQL Mesh capabilities

**✅ Architecture:**

- **Mesh Resolver**: Consolidates raw data from multiple Commerce APIs
- **App Builder Action**: Calls mesh → Uses buildProducts → Generates CSV
- **Single GraphQL Query**: Replaces hundreds of REST API calls
- **Configuration Driven**: Environment-specific batch sizes and endpoints

#### API Mesh Constraints

**Critical Limitations:**

- Cannot import Node.js modules (`require()` fails)
- Cannot access `src/` utilities directly
- Must use embedded configuration or HTTP calls
- Template literals not fully supported (use string concatenation)

### CRITICAL: Data Transformation Separation

**NEVER** perform data transformation in mesh resolvers. Always maintain strict separation of concerns:

```javascript
// ✅ CORRECT: Mesh resolver returns RAW consolidated data
// mesh-resolvers.js
const enrichedProduct = {
  ...product,
  qty: inventory.qty,
  categories: categoryObjects, // Raw category objects with id/name
  media_gallery_entries: product.media_gallery_entries, // Raw media data
  inventory: { qty: inventory.qty, is_in_stock: inventory.is_in_stock }
};

// ✅ CORRECT: Action uses buildProducts step for transformation
// actions/backend/get-products-mesh/index.js
const builtProducts = await buildProducts(enrichedProducts, config);

// ❌ WRONG: Mesh resolver doing transformation
enrichedProduct.images = product.media_gallery_entries.map(transformImageEntry);
enrichedProduct.categories = categoryObjects.map(cat => cat.name);

// ❌ WRONG: Action skipping buildProducts
const builtProducts = enrichedProducts; // Skips transformation!
```

**Transformation Responsibility Rules:**

- **Mesh Resolver**: ONLY consolidate raw data from multiple APIs
- **buildProducts Step**: ALWAYS handle data transformation (categories, images, etc.)
- **Actions**: NEVER skip buildProducts step - always use it for consistency
- **Raw Data**: Mesh should return data in same format as Commerce API responses

**Why This Matters:**

- **Code Reuse**: Same transformation logic used by REST API and Mesh methods
- **Consistency**: Identical CSV output guaranteed through shared transformation
- **Maintainability**: Single source of truth for business logic
- **Testing**: One transformation path to test and debug

## Common Patterns

- Configuration: Use the schema-validated config system
- File Operations: Use Adobe I/O Files SDK through existing utilities
- Commerce API: Use established Commerce integration patterns
- Frontend Updates: Use HTMX for dynamic content
- Error Responses: Use consistent error formatting
- Logging: Use appropriate log levels and formatting
- URL Building: Use the established URL management functions
- API Mesh: Always use True Mesh pattern with embedded resolvers
- **CRITICAL - Data Transformation**: NEVER transform data in mesh resolvers - always use buildProducts step
- **CRITICAL - Mesh Actions**: NEVER skip buildProducts step - always use it for consistency  
- **CRITICAL - Raw Data**: Mesh resolvers should return raw consolidated data, not transformed data

## Git Hooks and Code Quality

### Husky Pre-Commit Hooks

The project uses **Husky v9.1.7** for automated code quality enforcement via git hooks:

- **Pre-commit hook**: Runs `npx lint-staged` on every commit
- **Automatic formatting**: ESLint + Prettier for JavaScript, Prettier for JSON/YAML, markdownlint + Prettier for Markdown
- **Git stash backup**: Automatically backs up original state before applying fixes
- **Auto-application**: Fixes are automatically applied and included in the commit

### Husky v9 Migration Notes

- **Deprecated command**: `npx husky install` shows deprecation warning but still works
- **Modern command**: Use `npx husky init` for new setups
- **Current setup**: Fully functional despite deprecation warning
- **No action needed**: Existing configuration continues to work perfectly

## Recent Implementation Updates

### OAuth 1.0 Authentication (Implemented)

**CRITICAL: All Commerce API calls now use OAuth 1.0 authentication**

The project has been fully migrated to OAuth 1.0 authentication with HMAC-SHA256 signatures:

```javascript
// ✅ CORRECT: OAuth implementation pattern
const { makeCommerceRequest } = require('../../../src/commerce/api/integration');

// OAuth credentials automatically extracted from action parameters
const response = await makeCommerceRequest('/products', {
  method: 'GET',
}, params);
```

**Key Implementation Details:**

- **Core function**: `makeCommerceRequest()` handles all OAuth authentication automatically
- **Signature generation**: `createOAuthHeader()` implements proper HMAC-SHA256 with Postman-style URL parsing
- **Parameter handling**: `extractActionParams()` extracts OAuth credentials from Adobe I/O Runtime parameters
- **No pre-testing**: Authentication validation happens during actual API calls (no redundant auth tests)
- **Batch support**: `batchCommerceRequests()` for multiple authenticated API calls

**Required Configuration:**

All Commerce actions must have these OAuth credentials in `app.config.yaml`:
```yaml
COMMERCE_CONSUMER_KEY: $COMMERCE_CONSUMER_KEY
COMMERCE_CONSUMER_SECRET: $COMMERCE_CONSUMER_SECRET
COMMERCE_ACCESS_TOKEN: $COMMERCE_ACCESS_TOKEN
COMMERCE_ACCESS_TOKEN_SECRET: $COMMERCE_ACCESS_TOKEN_SECRET
```

**Migration Complete:**

- ✅ All actions updated to use OAuth authentication
- ✅ Legacy admin token authentication removed
- ✅ Test scripts updated for OAuth credential handling
- ✅ Mesh resolvers updated for OAuth credential passing

### Storage Error Handling (Fixed)

**CRITICAL: Storage error handling has been standardized**

Fixed storage display issues and error handling across all actions:

```javascript
// ✅ CORRECT: Storage error handling pattern
const storageResult = await storeCsv(csvData, actionParams);

// Always check for storage errors
if (!storageResult.stored) {
  throw new Error(`Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`);
}
```

**Key Fixes:**

- **Function signature**: `storeCsv(csvData, actionParams)` - exactly 2 parameters
- **Error checking**: Always verify `storageResult.stored` before proceeding
- **Error display**: Test scripts show "Storage Failed" instead of "ERROR"
- **No manual initialization**: Let `storeCsv()` handle storage initialization internally
- **Consistent responses**: All actions return proper storage provider information

**Storage Rules:**

- **Never manually initialize storage** in actions - use `storeCsv()` function
- **Always check storage results** - Don't assume storage operations succeed
- **Proper error messages** - Include specific error details when storage fails
- **Test script integration** - Storage provider correctly displayed in test output

### Validation Simplification (Cleaned Up)

**CRITICAL: Authentication validation has been simplified**

Removed redundant authentication testing to improve performance:

```javascript
// ✅ CORRECT: Simple parameter validation (no auth testing)
async function validateInput(params, config) {
  // Validate OAuth credentials are present
  checkMissingParams(params, ['COMMERCE_CONSUMER_KEY', 'COMMERCE_CONSUMER_SECRET', 
                              'COMMERCE_ACCESS_TOKEN', 'COMMERCE_ACCESS_TOKEN_SECRET']);
  
  // OAuth credentials will be validated when the first API call is made
}

// ❌ WRONG: Separate authentication testing (removed)
// await testOAuthAuthentication(params); // Redundant with actual API calls
```

**Validation Changes:**

- **No pre-authentication testing** - OAuth validation happens during actual API calls
- **Parameter presence only** - Validate credentials exist, don't test them separately
- **Performance improvement** - Eliminates unnecessary API calls during validation
- **Simpler error handling** - Authentication errors come from actual Commerce API calls
- **Removed modules**: Deleted `actions/backend/get-products/lib/auth.js` (no longer needed)

**Benefits:**

- ✅ Faster action execution (no redundant API calls)
- ✅ Simpler codebase (less authentication testing code)
- ✅ Better error messages (from actual Commerce API responses)
- ✅ Consistent with production patterns (validate during use, not before)

## File Recreation Strategy

### CRITICAL: Heredoc Pattern for Reliable File Creation

When edit tools fail or produce incomplete results, use heredoc pattern:
cat > path/to/file.js << 'EOF'
// Complete file content here
EOF

Use heredoc when: edit tools fail, multiple search_replace attempts fail, complex changes needed.
Benefits: Guarantees complete file replacement, works reliably, eliminates edit tool inconsistencies.
