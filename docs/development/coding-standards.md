# Coding Standards

> **Code quality standards for Adobe App Builder Commerce integration project**

## Code Quality Principles

### **1. Clarity Over Cleverness**

Write code that your future self (and teammates) can understand immediately.

````javascript
// ❌ Avoid - too clever, hard to understand
const p = products
.filter((p) => p.status === 'active' && p.inventory > 0)
.map((p) => ({ ...p, price: p.price \* 1.1 }));

// ✅ Prefer - clear and readable
const activeProducts = products.filter(
(product) => product.status === 'active' && product.inventory > 0
);

const productsWithTax = activeProducts.map((product) => ({
...product,
price: product.price \* TAX_MULTIPLIER,
}));

### **2. Consistent Error Handling**

All errors should be handled consistently across the application.

````javascript
// ✅ Standard error handling pattern
async function exportProducts(params) {
  const logger = Core.Logger('export-products', { level: params.LOG_LEVEL });

  try {
    validateInput(params, productExportSchema);
    const products = await getCommerceProducts(params);
    return createSuccessResponse(products);
  } catch (error) {
    logger.error('Product export failed', { error: error.message, params });
    return createErrorResponse(error, 'PRODUCT_EXPORT_FAILED');
  }
}

### **3. Meaningful Names**

Use descriptive names that explain intent and purpose.

````javascript
// ❌ Avoid - unclear abbreviations
function getPrds(cat, lmt) {
  // ...
}

// ✅ Prefer - clear, descriptive names
function getProductsByCategory(categoryId, maxResults) {
  // ...
}

## JavaScript Standards

### **ES6+ Features**

Use modern JavaScript features consistently.

```javascript
// ✅ Use const/let, never var
const API_BASE_URL = 'https://api.commerce.adobe.com';
let currentPage = 1;

// ✅ Use arrow functions for callbacks
const activeProducts = products.filter((product) => product.status === 'active');

// ✅ Use template literals
const apiUrl = `${API_BASE_URL}/products/${productId}`;

// ✅ Use destructuring
const { productId, categoryId, status } = params;

// ✅ Use async/await over promises
async function fetchProduct(id) {
  try {
    const response = await commerceApi.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw new ProductNotFoundError(id);
  }
}

### **Function Documentation**

Use JSDoc for all public functions.

```javascript
/**
 * Exports products from Adobe Commerce with filtering and pagination
 *
 * @param {Object} params - Export parameters
 * @param {string} params.categoryId - Commerce category ID to filter by
 * @param {number} [params.limit=100] - Maximum number of products to export
 * @param {string} [params.format='json'] - Export format (json, csv)
 * @param {string} params.LOG_LEVEL - Logging level for the operation
 *
 * @returns {Promise<Object>} Export result with products and metadata
 * @throws {ValidationError} When required parameters are missing
 * @throws {CommerceApiError} When Commerce API request fails
 *
 * @example
 * ```javascript
 * const result = await exportProducts({
 *   categoryId: '123',
 *   limit: 50,
 *   format: 'json',
 *   LOG_LEVEL: 'info'
 * });
 * ```
 */
async function exportProducts(params) {
  // Implementation...
}
`````

### **Error Classes**

Use custom error classes for different error types.

````javascript
// ✅ Custom error classes
class CommerceApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'CommerceApiError';
    this.status = status;
    this.response = response;
  }
}

class ValidationError extends Error {
  constructor(field, value, expected) {
    super(`Invalid ${field}: expected ${expected}, got ${value}`);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.expected = expected;
  }
}

// ✅ Use in actions
try {
  validateInput(params, schema);
} catch (error) {
  if (error instanceof ValidationError) {
    return createErrorResponse(error, 'INVALID_INPUT');
  }
  throw error;
}

## Adobe App Builder Patterns

### **Action Structure**

All actions should follow this consistent structure.

```javascript
/**
 * Adobe I/O Runtime action for [purpose]
 */
const { Core } = require('@adobe/aio-sdk');
const { getCommerceProducts } = require('../../src/commerce/api');
const { validateInput } = require('../../src/shared/validation');
const { createSuccessResponse, createErrorResponse } = require('../../src/core/responses');

async function main(params) {
  // 1. Initialize logger
  const logger = Core.Logger('action-name', { level: params.LOG_LEVEL });
  logger.info('Action started', { requestId: params.__ow_requestId });

  try {
    // 2. Validate input
    const validatedParams = validateInput(params, actionSchema);

    // 3. Perform operation using shared utilities
    const result = await performOperation(validatedParams);

    // 4. Return success response
    logger.info('Action completed successfully');
    return createSuccessResponse(result);
  } catch (error) {
    // 5. Handle errors consistently
    logger.error('Action failed', { error: error.message, stack: error.stack });
    return createErrorResponse(error);
  }
}

exports.main = main;

### **Shared Utilities Usage**

Always check `src/core/` before creating new utilities.

```javascript
// ✅ Use existing utilities
const { httpGet, httpPost } = require('../../src/core/http');
const { validateInput } = require('../../src/shared/validation');
const { cacheGet, cacheSet } = require('../../src/core/cache');

// ✅ Create new utilities in appropriate locations
// src/core/ - Generic utilities used across actions
// src/commerce/ - Commerce-specific integration code
// src/htmx/ - HTMX-specific response and helper functions

### **Configuration Management**

Use the schema-validated configuration system.

```javascript
// ✅ Load configuration with validation
const config = require('../../config/app-config');
const { commerceConfig } = config.getEnvironmentConfig();

// ✅ Access configuration values
const { baseUrl, accessToken, rateLimitConfig } = commerceConfig;

## HTMX Integration Standards

### **Response Patterns**

Use consistent response patterns for HTMX integration.

```javascript
// ✅ HTMX response utility
const { createHTMXResponse } = require('../../src/htmx/responses');

async function main(params) {
  const data = await fetchData(params);

  return createHTMXResponse({
    template: 'product-list',
    data: {
      products: data.products,
      pagination: data.pagination,
    },
    headers: {
      'HX-Trigger': 'products-updated',
      'HX-Push-Url': `/products?page=${data.currentPage}`,
    },
  });
}

### **Progressive Enhancement**

Ensure functionality works without JavaScript.

```javascript
// ✅ Provide fallback responses
function createResponse(data, isHTMXRequest) {
  if (isHTMXRequest) {
    return createHTMXResponse({ template: 'partial', data });
  } else {
    return createHTMXResponse({ template: 'full-page', data });
  }
}

## Security Standards

### **Input Validation**

Validate all inputs using schemas.

```javascript
// ✅ Define validation schemas
const productExportSchema = {
  type: 'object',
  required: ['categoryId'],
  properties: {
    categoryId: { type: 'string', pattern: '^[0-9]+$' },
    limit: { type: 'number', minimum: 1, maximum: 1000 },
    format: { type: 'string', enum: ['json', 'csv'] },
  },
};

// ✅ Validate in actions
try {
  const validatedParams = validateInput(params, productExportSchema);
} catch (error) {
  return createErrorResponse(error, 'INVALID_INPUT');
}

### **Safe Data Handling**

Never expose sensitive data in responses or logs.

```javascript
// ✅ Safe logging - exclude sensitive data
logger.info('Commerce API request', {
  url: sanitizeUrl(apiUrl),
  method: 'GET',
  // Never log tokens or secrets
});

// ✅ Safe error responses
catch (error) {
  logger.error('Internal error details', { error: error.stack });
  // Return generic error to client
  return createErrorResponse(new Error('Operation failed'), 'INTERNAL_ERROR');
}

## Performance Standards

### **Caching Strategy**

Use caching for expensive operations.

```javascript
// ✅ Implement caching for Commerce API calls
async function getProductsWithCache(categoryId, options = {}) {
  const cacheKey = `products:${categoryId}:${JSON.stringify(options)}`;

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached && !options.skipCache) {
    return cached;
  }

  // Fetch from API
  const products = await commerceApi.getProducts(categoryId, options);

  // Cache for future requests
  await cacheSet(cacheKey, products, CACHE_TTL);

  return products;
}

### **Resource Management**

Properly handle resources and cleanup.

```javascript
// ✅ Proper resource cleanup
async function processLargeFile(fileStream) {
  try {
    const results = [];
    for await (const chunk of fileStream) {
      results.push(await processChunk(chunk));
    }
    return results;
  } finally {
    // Always cleanup resources
    if (fileStream && typeof fileStream.close === 'function') {
      fileStream.close();
    }
  }
}

## Testing Standards

### **Test Structure**

Use consistent test structure and naming.

```javascript
// ✅ Clear test structure
describe('get-products action', () => {
  beforeEach(async () => {
    // Setup test environment
    mockCommerceApi();
  });

  afterEach(async () => {
    // Cleanup after each test
    resetMocks();
  });

  describe('when given valid parameters', () => {
    test('should return products successfully', async () => {
      // Arrange
      const params = { categoryId: '123', limit: 10 };

      // Act
      const result = await getProducts.main(params);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.body.products).toHaveLength(10);
    });
  });

  describe('when given invalid parameters', () => {
    test('should return validation error', async () => {
      // Test error scenarios
    });
  });
});

### **Test Action Scripts**

Use the provided test scripts for development.

```bash
# ✅ Test individual actions during development
npm run test:action -- actions/get-products

# ✅ Test with specific parameters
npm run test:action -- actions/get-products --param categoryId=123

# ✅ Performance testing
npm run perf:test -- actions/get-products

## Code Quality Tools

### **Automated Code Quality**

The project uses automated tools to enforce code quality standards:

```bash
# ESLint for JavaScript linting
npx eslint src/ actions/

# Prettier for code formatting
npx prettier --write "**/*.{js,json,md}"

# markdownlint for documentation
npx markdownlint docs/
```

### **Git Hooks (Husky)**

Pre-commit hooks automatically enforce code quality:

```bash
# Verify git hooks are active
git config --get core.hooksPath  # Should show .husky/_

# What happens on commit:
# 1. ESLint fixes JavaScript issues
# 2. Prettier formats all code
# 3. markdownlint fixes documentation
# 4. Changes are automatically staged and committed
```

**Pre-commit Hook Configuration:**

```javascript
// .husky/pre-commit runs lint-staged
"lint-staged": {
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,yml,yaml}": ["prettier --write"],
  "*.md": ["markdownlint --fix", "prettier --write"]
}
```

### **Quality Enforcement**

- **Automatic**: All staged files processed on commit
- **Non-blocking**: Fixes applied automatically, commits proceed
- **Consistent**: Same standards across entire codebase
- **Backup**: Git stash protects original changes

> **Note**: Husky v9 shows deprecation warning for `npx husky install` but works correctly.

## Code Organization

### **File Structure Rules**

Follow the established project structure.

```text
actions/action-name/
├── index.js              # Main action function
├── schema.js             # Input validation schema
├── __tests__/            # Action-specific tests
│   └── index.test.js
└── README.md             # Action documentation
```

### **Index.js Exporter Pattern**

**CRITICAL: All index.js files must be pure exporters - no function implementations allowed.**

This standard applies to both **Complete DDD** (src/) and **Light DDD** (scripts/) architectures.

```javascript
// ✅ CORRECT: Pure exporter pattern
const parameterHandling = require('./parameter-handling');
const urlBuilding = require('./url-building');
const responseHandling = require('./response-handling');

module.exports = {
  // Pure re-exports - no function implementations
  filterActionParameters: parameterHandling.filterActionParameters,
  buildActionUrl: urlBuilding.buildActionUrl,
  isSuccessfulResponse: responseHandling.isSuccessfulResponse,
  
  // Structured access for organized usage
  operations: {
    parameterHandling,
    urlBuilding,
    responseHandling,
  },
};
```

```javascript
// ❌ WRONG: Mixed implementation pattern
const testExecution = require('./test-execution');

// PROBLEM: Functions implemented in index.js
function filterActionParameters(params) { /* implementation */ }
function buildActionUrl(actionName, params) { /* implementation */ }

module.exports = {
  testExecution,
  filterActionParameters, // Mixed pattern violates standard
  buildActionUrl,
};
```

**Benefits of Pure Exporter Pattern:**

1. **🔍 Findability**: Know implementations are in separate files
2. **📋 Documentation**: Index acts as domain API documentation  
3. **🧹 Single Responsibility**: Index = exports, other files = implementation
4. **🔧 Maintainability**: Easier to locate and modify specific functions

**Implementation Approach:**

- **Move functions** to separate implementation files (e.g., `parameter-handling.js`, `url-building.js`)
- **Update index.js** to import and re-export functionality
- **Maintain API compatibility** - external imports don't change

### **Environment Detection Pattern**

**CRITICAL: All environment detection must use direct imports from the shared utility.**

This standard ensures consistency, readability, and prevents code duplication.

```javascript
// ✅ CORRECT: Direct import pattern for clean readability
const { parseEnvironmentFromArgs, getEnvironmentString } = require('./core/operations/environment');

async function main() {
  const args = parseDeployArgs();
  
  // Parse environment from CLI arguments
  const isProd = parseEnvironmentFromArgs(args);
  
  // Convert to environment string when needed
  const environment = getEnvironmentString(isProd);
  
  // Use isProd for config loading
  const config = loadConfig({}, isProd);
}
```

```javascript
// ❌ WRONG: Verbose namespace pattern
const { operations } = require('./core');
const isProd = operations.environment.parseEnvironmentFromArgs(args);

// ❌ WRONG: Inline environment detection
const isProd = args.environment === 'production';
const environment = isProd ? 'production' : 'staging';

// ❌ WRONG: Duplicate logic across files
const isProd = params.NODE_ENV === 'production';
```

**Available Environment Utilities:**

```javascript
// ✅ CORRECT: Direct imports for specific needs
const { parseEnvironmentFromArgs } = require('./core/operations/environment');
const { parseEnvironmentFromParams } = require('./core/operations/environment');  
const { getEnvironmentString } = require('./core/operations/environment');

// ✅ CORRECT: Multiple imports in one statement
const { parseEnvironmentFromArgs, getEnvironmentString } = require('./core/operations/environment');
```

**Benefits of Direct Import Pattern:**

1. **📖 Readability**: Clean function calls without namespace pollution
2. **🎯 Selective**: Only import what you need
3. **🔧 Maintainability**: Self-documenting function names
4. **🚀 Performance**: Smaller import footprint

**Migration Pattern:**

1. **Replace namespace imports**: `const { operations } = require('./core');` → `const { parseEnvironmentFromArgs, getEnvironmentString } = require('./core/operations/environment');`
2. **Update function calls**: `operations.environment.parseEnvironmentFromArgs(args)` → `parseEnvironmentFromArgs(args)`
3. **Remove manual capitalization**: Let `format.environment()` handle capitalization
4. **Maintain compatibility**: All existing APIs continue to work

**Direct Import Standard:**

```javascript
// ✅ CORRECT: Clean, readable, self-documenting
const { parseEnvironmentFromArgs, getEnvironmentString } = require('./core/operations/environment');
const isProd = parseEnvironmentFromArgs(args);
const environment = getEnvironmentString(isProd);
console.log(format.environment(environment));

// ❌ WRONG: Verbose namespace pattern
const { operations } = require('./core');
const isProd = operations.environment.parseEnvironmentFromArgs(args);
const environment = operations.environment.getEnvironmentString(isProd);
```

### **Import Organization**

Organize imports consistently.

```javascript
// ✅ Import order: Node.js built-ins, npm packages, local utilities
const path = require('path');
const { Core } = require('@adobe/aio-sdk');
const { getCommerceProducts } = require('../../src/commerce/api');
const { validateInput } = require('../../src/shared/validation');

## Documentation Standards

### **README Updates**

Keep documentation in sync with code changes.

```markdown
# Action Name

## Purpose

Brief description of what this action does.

## Parameters

- `param1` (string, required): Description
- `param2` (number, optional): Description, default: 100

## Response

Description of response format with examples.

## Examples

```bash
npm run test:action -- actions/action-name --param param1=value
````

## Dependencies

- src/commerce/api.js
- src/shared/validation.js

### **Code Comments**

Use comments sparingly for complex logic only.

````javascript
// ✅ Good comment - explains why, not what
// Use exponential backoff for Commerce API rate limits
// as documented in their API guidelines
const delay = Math.min(1000 * Math.pow(2, retryCount), MAX_DELAY);

// ❌ Avoid obvious comments
// Increment the counter by 1
counter++;

```javascript
````
