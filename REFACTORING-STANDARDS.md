# Refactoring Standards & Rubric

## Purpose

This document defines the standards for refactoring the Adobe App Builder Commerce integration application. Every change must meet these criteria to be accepted.

## Core Principles

### 1. **Clarity Over Cleverness**

- Code should be immediately understandable by someone unfamiliar with it
- No "clever" solutions that require deep knowledge to understand
- **Test**: Can a new developer understand this function in 60 seconds?

### 2. **Practical Over Perfect**

- Favor working, clear code over architectural purity
- No rigid rules that make code harder to understand
- **Test**: Does this change make the code easier to work with?

### 3. **Consistency Over Creativity**

- Same patterns used throughout the application
- No special cases or unique approaches
- **Test**: Could this pattern be applied to similar functions?

### 4. **Functional Composition Over Object Inheritance**

- Use pure functions that compose well together
- Favor functional composition over class hierarchies
- **Test**: Is this function pure with clear input/output contracts?

### 5. **Discoverability First**

- Optimize for finding existing functionality quickly
- Use catalog pattern with clear domain organization
- **Test**: Can developers find this functionality in under 30 seconds?

## Action Framework Standards

### CRITICAL: Always Use Action Framework

**ALL actions must use the action framework**. Never create actions that bypass `createAction()`:

```javascript
// ✅ CORRECT: Use action framework
const { createAction } = require('../../../src/core');

async function actionBusinessLogic(context) {
  // Pure business logic only
}

module.exports = createAction(actionBusinessLogic, {
  actionName: 'action-name',
  domains: ['domain1', 'domain2'],
  withLogger: true,
  description: 'Action description'
});

// ❌ WRONG: Manual action creation
async function main(params) {
  // Manual parameter extraction, error handling, etc.
}

module.exports = { main };
```

### Clean Orchestrator Pattern (MANDATORY)

**Every action `index.js` MUST follow this exact pattern:**

```javascript
/**
 * Business logic for action-name
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function actionBusinessLogic(context) {
  const { domain1, domain2, core, config, params } = context;
  const steps = [];

  // Step 1: Clear business operation
  const result1 = await domain1.operation(params, config);
  steps.push(core.formatStepMessage('step-name', 'success', { data: result1 }));

  // Step 2: Domain operation  
  const result2 = await domain2.operation(result1, config);
  steps.push(core.formatStepMessage('step-name', 'success', { data: result2 }));

  // Step 3: Domain operation
  const result3 = await domain1.finalOperation(result2, config);
  steps.push(core.formatStepMessage('step-name', 'success', { data: result3 }));

  return core.success(result3, 'Operation completed successfully', {});
}
```

**Required Elements:**

- ✅ **Step-based workflow** with `steps` array
- ✅ **Consistent messaging** with `core.formatStepMessage()`
- ✅ **Domain function calls** only (no business logic implementation)
- ✅ **Single return point** with `core.success()`
- ✅ **Clean destructuring** from context

### Action Length Guidelines

- **Target**: 40-60 lines for action `index.js` files
- **Maximum**: 80 lines before extracting to `lib/`
- **Split Required**: When action has multiple distinct responsibilities

**✅ Good Example (get-products pattern):**

```javascript
async function getProductsBusinessLogic(context) {
  const { products, files, core, config, params } = context;
  const steps = [];

  // Step 1: Validate input
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Fetch and enrich products
  const productData = await products.fetchAndEnrichProducts(params, config);
  steps.push(core.formatStepMessage('fetch-and-enrich', 'success', { count: productData.length }));

  // Step 3: Build products with transformation
  const builtProducts = await products.buildProducts(productData, config);
  steps.push(core.formatStepMessage('build-products', 'success', { count: builtProducts.length }));

  // Step 4: Create CSV
  const csvData = await products.createCsv(builtProducts, config);
  steps.push(core.formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize }));

  // Step 5: Store CSV
  const storageResult = await files.storeCsv(csvData.content, config, params);
  steps.push(core.formatStepMessage('store-csv', 'success', { info: storageResult }));

  return core.success({
    steps,
    storage: storageResult,
    downloadUrl: storageResult.downloadUrl,
  }, 'Product export completed successfully', {});
}
```

**❌ Bad Example:**

```javascript
async function processProductExport(context) {
  // 120 lines that mix validation, fetching, transformation, storage, and error handling
}
```

### Complex Logic Organization

When actions exceed 60-80 lines, extract complex logic to `lib/`:

```text
actions/
  backend/
    action-name/
      index.js              # ALWAYS clean orchestrator (40-60 lines)
      lib/                  # Action-specific helpers (when needed)
        steps.js            # Complex step orchestration
        operations.js       # Data operations
        formatters.js       # Response formatting
        handlers.js         # Request routing
        error-handling.js   # Specialized error handling
```

**✅ Extraction Example:**

```javascript
// actions/backend/get-products-mesh/lib/steps.js
async function executeMeshDataSteps(context) {
  const { products, core, config, params, trace } = context;
  const steps = [];

  // Step 1: Validate mesh configuration
  await core.traceStep(trace, 'validate-mesh', async () => {
    return await products.validateMeshInput(params, config);
  });
  steps.push(core.formatStepMessage('validate-mesh', 'success'));

  // Complex logic continues...
  return { steps, meshData, builtProducts };
}

// actions/backend/get-products-mesh/index.js  
async function getProductsMeshBusinessLogic(context) {
  const { steps, csvData } = require('./lib/steps');
  
  // Simple orchestration
  const { steps: dataSteps, builtProducts } = await steps.executeMeshDataSteps(context);
  const { storageResult, steps: csvSteps } = await steps.executeCsvSteps(builtProducts, { ...context, steps: dataSteps });
  
  return core.success(result, message, {});
}
```

### Domain Function Requirements

**Actions MUST call domain functions, never implement business logic:**

```javascript
// ✅ CORRECT: Call domain functions
async function actionBusinessLogic(context) {
  const { products, files } = context;
  
  const data = await products.fetchAndEnrichProducts(params, config);
  const csv = await products.createCsv(data, config);
  const storage = await files.storeCsv(csv, config, params);
}

// ❌ WRONG: Implement business logic in action
async function actionBusinessLogic(context) {
  // 50 lines of product fetching logic
  // 30 lines of transformation logic
  // 20 lines of CSV generation logic
}
```

## Function Standards

### Length Guidelines

- **Target**: 10-40 lines for most functions
- **Acceptable**: Up to 60 lines if genuinely single responsibility
- **Split Required**: When function handles multiple distinct concerns

### Single Responsibility Rule

- Each function should do ONE thing well
- Function name should clearly indicate its purpose
- **Test**: Can you explain what this function does in one sentence?

**✅ Good Example:**

```javascript
function validateCommerceCredentials(credentials) {
  if (!credentials.username || !credentials.password) {
    throw new Error('Commerce username and password are required');
  }
  
  if (!credentials.baseUrl) {
    throw new Error('Commerce base URL is required');
  }
  
  return true;
}
```

**❌ Bad Example:**

```javascript
function processProductExport(params) {
  // 80 lines that validate, fetch, transform, and store
}
```

### Parameter Clarity

- Parameters should be explicit and self-documenting
- Avoid mysterious objects with unclear contents
- **Test**: Are the required inputs obvious from the function signature?

**✅ Good Example:**

```javascript
function buildProductCsv(products, config, headers) {
  // Clear what each parameter is for
}
```

**❌ Bad Example:**

```javascript
function buildProductCsv(params) {
  // What's in params? Who knows!
}
```

## Error Handling Standards

### Framework Error Handling

**NEVER implement custom error handling in actions**. The framework handles all errors:

```javascript
// ✅ CORRECT: Let framework handle errors
async function actionBusinessLogic(context) {
  // Business logic that may throw
  const result = await domain.operation(params);
  return core.success(result, message, {});
}

// ❌ WRONG: Custom error handling
async function actionBusinessLogic(context) {
  try {
    const result = await domain.operation(params);
    return core.success(result, message, {});
  } catch (error) {
    // Custom error handling - framework already does this!
    return core.error(error, {});
  }
}
```

### Meaningful Error Messages

- Errors should explain what went wrong AND what the user should do
- Include context about what operation failed
- **Test**: Would this error message help someone fix the problem?

**✅ Good Example:**

```javascript
if (!credentials.username) {
  throw new Error('Commerce username is required. Please set COMMERCE_ADMIN_USERNAME in your .env file');
}
```

**❌ Bad Example:**

```javascript
if (!credentials.username) {
  throw new Error('Invalid credentials');
}
```

## Code Organization Standards

### Domain Organization Requirements

**Use domain catalogs for ALL shared functionality:**

```javascript
// ✅ CORRECT: Call through domain catalog
const { products, files, commerce } = require('../../src');

const data = await products.fetchAndEnrichProducts(params, config);
const csv = await files.storeCsv(csvData, config, params);

// ❌ WRONG: Direct utility imports
const { fetchProducts } = require('../../src/commerce/api/products');
const { storeFile } = require('../../src/core/storage/operations');
```

### Helper Function Extraction

- **Extract**: Only when code is duplicated in 3+ places
- **Don't Extract**: Code that's similar but not identical
- **Test**: Is this helper actually reducing duplication or just adding abstraction?

**✅ Extract This:**

```javascript
// Used in 5 different places, exactly the same
function buildCommerceApiUrl(baseUrl, endpoint) {
  return `${baseUrl}/rest/V1/${endpoint}`;
}
```

**❌ Don't Extract This:**

```javascript
// Similar but different validation logic in each place
function validateProductData(product) {
  // Each usage has different validation requirements
}
```

### Import Organization

- Group imports logically (framework, domains, utilities)
- Use clear, descriptive import names
- **Test**: Are imports organized and easy to understand?

**✅ Good Organization:**

```javascript
// Action framework
const { createAction } = require('../../../src/core');

// Domain imports (if needed for complex actions)
const { executeMeshDataSteps } = require('./lib/steps');
const { formatMeshResponse } = require('./lib/formatters');
```

## Testing Standards

### Deployment Reality

- **CRITICAL**: Most changes require `npm run deploy` to properly test
- **Deployment takes time** - make changes small enough to test efficiently
- **Test failures are expensive** - broken functionality might not be caught until after deployment
- **Rollback planning** - ensure changes are easily reversible

### Framework Testing

**Always test action framework integration:**

```bash
# Test individual actions
npm run test:action get-products
npm run test:action get-products-mesh

# Test framework doesn't break existing functionality
npm run deploy
```

### Functionality Preservation

- **CRITICAL**: No existing functionality can be broken
- All refactored functions must maintain exact same behavior
- **Test**: Does `npm run test:action` still work after changes?

## Action Framework Benefits

### Code Quality Metrics

- **Zero duplication** across actions (216 lines eliminated)
- **Consistent patterns** (100% compliance)
- **Average action size**: 46 lines (down from 123 lines)
- **Boilerplate eliminated**: 15-25 lines per action

### Development Standards

- **Predictable structure** in every action
- **Self-documenting** business logic flows
- **Easy maintenance** through consistent patterns
- **Fast development** with framework templates

## Compliance Checklist

Before approving any action changes, verify:

- [ ] **Uses action framework** (`createAction()` wrapper)
- [ ] **Clean orchestrator pattern** (step-based workflow)
- [ ] **Domain function calls** (no business logic implementation)
- [ ] **Consistent messaging** (`core.formatStepMessage()`)
- [ ] **Single return point** (`core.success()`)
- [ ] **Proper extraction** (complex logic in `lib/` when needed)
- [ ] **Framework testing** (action still works after changes)
- [ ] **No custom error handling** (framework handles all errors)

## Migration Guide

### Converting Existing Actions

1. **Start with get-products pattern**:

   ```bash
   # Use get-products as template
   cp actions/backend/get-products/index.js actions/backend/new-action/index.js
   ```

2. **Follow framework pattern**:
   - Import `createAction` from core
   - Create `businessLogic` function with context parameter
   - Use step-based workflow with domain calls
   - Return `core.success()` with proper structure

3. **Extract complex logic**:
   - Create `lib/` directory when action exceeds 60 lines
   - Move complex logic to appropriate lib files
   - Keep action `index.js` as clean orchestrator

4. **Test integration**:
   - Deploy and test action functionality
   - Verify framework patterns work correctly
   - Confirm no existing functionality is broken

### Creating New Actions

1. **Always start with framework template**
2. **Follow clean orchestrator pattern from get-products**
3. **Use domain catalogs for shared functionality**
4. **Extract complex logic to lib/ when needed**
5. **Test thoroughly with deployment**

## Conclusion

The action framework eliminates duplication while ensuring consistent, maintainable patterns across all Adobe App Builder actions. Every action must follow the clean orchestrator pattern, with framework handling all infrastructure concerns and business logic clearly separated into domain functions.

This architecture enables rapid development while maintaining high code quality and consistency throughout the application.
