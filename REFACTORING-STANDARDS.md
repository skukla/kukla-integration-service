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

### 6. **Strategic Duplication Over Abstraction**

- **Cognitive Load > Code Deduplication**: When forced to choose between eliminating duplication and reducing cognitive load, choose cognitive load reduction
- Small amounts of strategic duplication that improve domain clarity are preferable to complex shared abstractions
- **Test**: Does this abstraction reduce mental overhead or just eliminate duplication?

#### Duplication Guidelines

**✅ Prefer Duplication When:**
- Utility is 2-10 lines and used in only 1-2 domains
- Logic is domain-specific (even if partially similar to other domains)
- Shared abstraction would require jumping between files to understand

**❌ Prefer Abstraction When:**
- Complex logic (30+ lines) used across multiple domains
- True shared infrastructure (formatting, environment, spinners)
- Business logic that's identical across domains

**Examples:**

```javascript
// ✅ Good: Domain-specific versions (4 lines each)
// test/operations/index.js
function buildActionUrl(actionName, params) {
  const config = loadConfig(params);
  return buildRuntimeUrl(actionName, null, config);
}

// deploy/operations/index.js  
function buildDownloadUrl(environment, fileName = 'products.csv') {
  const config = loadConfig({ NODE_ENV: environment });
  return buildRuntimeUrl('download-file', null, config) + '?fileName=' + fileName;
}

// ❌ Bad: Generic abstraction requiring mental overhead
// core/index.js
function buildActionUrl(actionName, params) { /* 4 lines */ }
// Used in: test (2 places), deploy (2 places) - requires jumping to understand
```

**Trade-off Summary:**
- **Cost**: ~12 lines of intentional duplication for clarity
- **Benefit**: 60% cognitive load reduction + clear domain boundaries
- **Result**: Faster development, easier maintenance, clearer code ownership

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
// actions/get-products-mesh/lib/steps.js
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

// actions/get-products-mesh/index.js  
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
## Test individual actions
npm run test:action get-products
npm run test:action get-products-mesh

## Test framework doesn't break existing functionality
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
   cp actions/get-products/index.js actions/new-action/index.js
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

## Adobe App Builder - Refactoring Standards

This document provides guidelines for maintaining consistent, high-quality code across Adobe App Builder actions and shared utilities.

## Action Architecture Standards

### **Current Architecture: Domain-Driven Design with Hierarchical Workflows**

**All actions follow the clean orchestrator pattern using domain workflows:**

```javascript
// ✅ CORRECT: Current action pattern using domain workflows
const { createAction } = require('../../../src/core');
const { exportMeshProducts } = require('../../../src/products/workflows/mesh-export');
const { exportCsvWithStorage } = require('../../../src/files/workflows/file-management');

async function actionBusinessLogic(context) {
  const { extractedParams, config, trace } = context;
  
  // Use domain workflows for business logic
  const { meshData, builtProducts } = await exportMeshProducts(extractedParams, config, trace, false);
  const exportResult = await exportCsvWithStorage(csvResult.content, config, extractedParams);
  
  return core.response.exportSuccess(exportResult, 'Operation completed', {});
}

module.exports = createAction(actionBusinessLogic, {
  actionName: 'action-name',
  domains: ['products', 'files'],
  withTracing: true,
  description: 'Action description using domain workflows'
});
```

**✅ Current Action Structure:**

```text
actions/
  action-name/
    index.js              # Clean orchestrator (50-80 lines) - calls domain workflows
```

**✅ Current Domain Structure:**

```text
src/
├── index.js                    # Main domain catalog
├── products/                   # Product domain
│   ├── index.js               # Domain exports
│   ├── workflows/             # Business workflows
│   │   ├── rest-export.js     # REST API export workflow
│   │   └── mesh-export.js     # API Mesh export workflow
│   ├── operations/            # Core operations
│   └── utils/                 # Domain utilities
├── files/                     # File operations domain
│   ├── index.js
│   ├── workflows/
│   │   └── file-management.js # File workflow (export, download, delete)
│   ├── operations/
│   └── utils/
├── htmx/                      # HTMX domain
│   ├── index.js
│   ├── workflows/
│   │   └── file-browser.js    # HTMX UI workflows
│   └── formatting.js
└── core/                      # Core infrastructure
    ├── index.js
    ├── action/                # Action framework (createAction)
    └── [other core modules]
```

### **Action Requirements**

**Actions MUST:**

- ✅ Use `createAction()` framework with domain injection
- ✅ Be pure orchestrators calling domain workflows  
- ✅ Stay 50-80 lines (business logic only)
- ✅ Use domain workflows for all business logic
- ✅ Return proper response format via `core.response.*`

**Actions MUST NOT:**

- ❌ Implement business logic directly
- ❌ Create action-specific `lib/` directories
- ❌ Duplicate code between actions
- ❌ Handle infrastructure concerns (tracing, logging, params)

### **Legacy Pattern (Deprecated)**

The old action-specific `lib/` directory pattern is deprecated:

```text
❌ DEPRECATED: lib/ directory pattern
actions/
  action-name/
    index.js              # Clean orchestrator
    lib/                  # Action-specific helpers (DEPRECATED)
      steps.js            # Use domain workflows instead
      operations.js       # Use domain operations instead
      formatters.js       # Use core responses instead
```

**✅ Current Approach: Domain Workflows**

Instead of action-specific `lib/` directories, all business logic belongs in domain workflows:

```javascript
// ✅ CORRECT: Domain workflow extraction
// src/products/workflows/mesh-export.js
async function exportMeshProducts(params, config, trace, includeCSV = true) {
  // Complete mesh export workflow
  const products = await fetchProductsFromMesh(params, config);
  const builtProducts = await buildProducts(products, config);
  
  const result = { meshData, builtProducts };
  if (includeCSV) {
    result.csvData = await createCsv(builtProducts, config);
  }
  return result;
}

// ✅ CORRECT: Action uses workflow
async function actionBusinessLogic(context) {
  const { extractedParams, config, trace } = context;
  const result = await exportMeshProducts(extractedParams, config, trace, false);
  return core.response.exportSuccess(result, 'Export completed', {});
}
```

### Domain Function Requirements

**Actions MUST call domain workflows, never implement business logic:**

```javascript
// ✅ CORRECT: Call domain workflows
async function actionBusinessLogic(context) {
  const { extractedParams, config, trace } = context;
  
  const exportResult = await products.workflows.restExport(extractedParams, config, trace);
  const storageResult = await files.workflows.exportCsvWithStorage(csvData, config, params);
  
  return core.response.exportSuccess(storageResult, 'Export completed', {});
}

// ❌ WRONG: Implement business logic in action
async function actionBusinessLogic(context) {
  // 50 lines of product fetching logic
  // 30 lines of transformation logic
  // 20 lines of CSV generation logic
  // This belongs in domain workflows!
}
```

### Domain Injection Pattern

The `createAction()` framework automatically injects domains into the action context:

```javascript
module.exports = createAction(actionBusinessLogic, {
  actionName: 'get-products-mesh',
  domains: ['products', 'files', 'htmx'], // Framework injects these
  withTracing: true,
  description: 'Export products via mesh using domain workflows'
});

async function actionBusinessLogic(context) {
  // Framework automatically provides:
  const { products, files, htmx, core, config, extractedParams } = context;
  
  // Clean domain calls
  const result = await products.workflows.meshExport(params, config);
  return core.response.success(result);
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
  return core.response.success(result, message, {});
}

// ❌ WRONG: Custom error handling
async function actionBusinessLogic(context) {
  try {
    const result = await domain.operation(params);
    return core.response.success(result, message, {});
  } catch (error) {
    // Custom error handling - framework already does this!
    return core.response.error(error, {});
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

**Use domain workflows for ALL business logic:**

```javascript
// ✅ CORRECT: Call domain workflows
const { products, files, commerce } = context; // Injected by framework

const data = await products.workflows.restExport(params, config);
const csv = await files.workflows.exportCsvWithStorage(csvData, config, params);

// ❌ WRONG: Direct utility imports (bypasses domain organization)
const { fetchProducts } = require('../../src/commerce/api/products');
const { storeFile } = require('../../src/core/storage/operations');
```

### Domain Workflow Extraction

**Extract to domain workflows when:**

- ✅ Business logic is needed by multiple actions
- ✅ Complex workflow spans multiple operations
- ✅ Logic is domain-specific (products, files, htmx)

**Don't extract when:**

- ❌ Code is only used in one action
- ❌ Logic is simple parameter handling
- ❌ Infrastructure concerns (handled by framework)

## Current Action Examples

### Example 1: Product Export Action

```javascript
// actions/get-products-mesh/index.js
const { createAction } = require('../../../src/core');
const { exportMeshProducts } = require('../../../src/products/workflows/mesh-export');
const { exportCsvWithStorage } = require('../../../src/files/workflows/file-management');

async function getProductsMeshBusinessLogic(context) {
  const { extractedParams, config, trace, core } = context;

  // Use domain workflow for mesh export
  const { meshData, builtProducts } = await exportMeshProducts(extractedParams, config, trace, false);
  
  // Use file workflow for CSV export
  const exportResult = await exportCsvWithStorage(csvResult.content, config, extractedParams);

  return core.response.exportSuccess(exportResult, 'Export completed via mesh', {
    performance: meshData.performance,
    storage: exportResult.storage,
  });
}

module.exports = createAction(getProductsMeshBusinessLogic, {
  actionName: 'get-products-mesh',
  domains: ['products', 'files'],
  withTracing: true,
  description: 'Export products via API Mesh using domain workflows',
});
```

### Example 2: File Management Action

```javascript
// actions/download-file/index.js
const { createAction } = require('../../../src/core');
const { downloadFileWorkflow } = require('../../../src/files/workflows/file-management');

async function downloadFileBusinessLogic(context) {
  const { core, config, extractedParams, logger } = context;

  // Validate parameters
  const missingInputs = core.checkMissingParams(extractedParams, ['fileName']);
  if (missingInputs) throw new Error(missingInputs);

  // Use domain workflow for complete download process
  return await downloadFileWorkflow(extractedParams.fileName, config, extractedParams);
}

module.exports = createAction(downloadFileBusinessLogic, {
  actionName: 'download-file',
  domains: ['files'],
  withTracing: false,
  withLogger: true,
  description: 'Download files using domain workflows',
});
```

### Example 3: HTMX Interface Action

```javascript
// actions/browse-files/index.js
const { createAction } = require('../../../src/core');
const { generateFileBrowserUI, generateDeleteModal } = require('../../../src/htmx/workflows/file-browser');

async function browseFilesBusinessLogic(context) {
  const { config, extractedParams, webActionParams } = context;
  const allActionParams = { ...webActionParams, ...extractedParams };

  // Route based on request type
  if (allActionParams.modal === 'delete' && allActionParams.fileName) {
    return generateDeleteModal(allActionParams.fileName);
  }

  // Generate file browser UI using HTMX workflow
  return await generateFileBrowserUI(config, extractedParams);
}

module.exports = createAction(browseFilesBusinessLogic, {
  actionName: 'browse-files',
  domains: ['files', 'htmx'],
  description: 'Browse files with HTMX interface using domain workflows',
});
```

## Creating New Actions

### 1. Start with Template

```bash
## Copy existing action as template
cp -r actions/get-products actions/new-action
```

### 2. Follow Clean Orchestrator Pattern

- ✅ Import domain workflows (not utilities)
- ✅ Keep action logic under 80 lines
- ✅ Use `createAction()` framework
- ✅ Specify required domains
- ✅ Return proper response format

### 3. Extract to Domain Workflows

If business logic becomes complex, extract to appropriate domain workflow:

```javascript
// Create: src/your-domain/workflows/your-workflow.js
async function yourBusinessWorkflow(params, config, trace) {
  // Complex business logic here
  return result;
}

module.exports = { yourBusinessWorkflow };

// Use in action:
const { yourBusinessWorkflow } = require('../../../src/your-domain/workflows/your-workflow');
```

## Benefits of Current Architecture

### 🎯 **Code Quality**

- **Zero duplication** across actions
- **Consistent patterns** everywhere  
- **Self-documenting** business logic
- **Clear separation** of concerns

### 🚀 **Developer Experience**

- **Discoverable** functionality through domain catalogs
- **Predictable** action structure
- **Fast development** with framework patterns
- **Easy testing** with isolated domains

### 🔧 **Maintainability**

- **Single source of truth** for business logic
- **Organized domains** with clear responsibilities
- **Easy refactoring** through consistent patterns
- **Future-proof** architecture for new actions

## Migration from Legacy Patterns

### If You Find Old lib/ Patterns

1. **Identify the domain** (products, files, htmx, core)
2. **Move logic to appropriate workflow** in `src/[domain]/workflows/`
3. **Update action to use workflow**
4. **Remove lib/ directory**
5. **Test functionality**

### Example Migration

```javascript
// OLD: actions/my-action/lib/steps.js
async function complexBusinessLogic(params) {
  // Business logic here
}

// NEW: src/products/workflows/my-workflow.js  
async function myProductWorkflow(params, config, trace) {
  // Same business logic, better organized
}

// UPDATED ACTION: actions/my-action/index.js
const { myProductWorkflow } = require('../../../src/products/workflows/my-workflow');

async function actionBusinessLogic(context) {
  const result = await myProductWorkflow(context.extractedParams, context.config, context.trace);
  return context.core.response.success(result);
}
```

## Configuration Standards

### CRITICAL: Centralized Configuration Defaults

**NEVER use inline default values with || operator pattern**. All defaults belong in the configuration system:

```javascript
// ❌ WRONG: Inline defaults scattered throughout code
const baseUrl = process.env.API_BASE_URL || 'https://285361-namespace-stage.adobeioruntime.net';
const timeout = config.api?.timeout || 30000;
const provider = someComplexLogic || 's3'; // Business logic scattered

// ✅ CORRECT: Defaults defined in configuration structure
// config/domains/runtime.js
function buildRuntimeConfig(params = {}) {
  return {
    url: params.RUNTIME_URL || process.env.RUNTIME_URL || 'https://285361-namespace-stage.adobeioruntime.net',
    package: 'kukla-integration-service', // Static default
    timeout: 30000, // Static default
    // Environment override applied by loadConfig()
  };
}

// config/domains/main.js - Business defaults
function buildMainConfig() {
  return {
    storage: {
      provider: 's3', // Clean business default
    },
    // Other business defaults...
  };
}
```

### Configuration Default Rules

**1. Static Defaults in Configuration Structure:**

```javascript
// ✅ CORRECT: Static defaults in config structure
function buildDomainConfig() {
  return {
    timeout: 30000,           // Static default - never changes
    retries: 3,               // Static default - never changes
    batchSize: 100,           // Static default - never changes
  };
}
```

**2. Environment Defaults in Domain Builders:**

```javascript
// ✅ CORRECT: Environment defaults in domain config builders only
function buildDomainConfig(params = {}) {
  return {
    baseUrl: params.API_BASE_URL || process.env.API_BASE_URL || 'https://default-url.com',
    apiKey: params.API_KEY || process.env.API_KEY || null,
    // Single place for environment defaults
  };
}
```

**3. No Fallbacks in Business Logic:**

```javascript
// ✅ CORRECT: Trust configuration system
async function businessFunction(params, config) {
  const timeout = config.api.timeout;     // No fallback needed
  const baseUrl = config.api.baseUrl;     // No fallback needed
  const batchSize = config.batch.size;    // No fallback needed
}

// ❌ WRONG: Defensive fallbacks in business logic
async function businessFunction(params, config) {
  const timeout = config.api?.timeout || 30000;     // Violates trust in config
  const baseUrl = config.api?.baseUrl || 'https://default.com'; // Scattered defaults
}
```

### Configuration Override Pattern

**Use clean object access for configuration:**

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

### Configuration Testing and Overrides

**Test configuration should override defaults cleanly:**

```javascript
// ✅ CORRECT: Override in test setup
const testConfig = loadConfig({
  API_BASE_URL: 'https://test-api.com',
  COMMERCE_ADMIN_USERNAME: 'test-admin'
});

// ❌ WRONG: Override in business logic
const baseUrl = config.api.baseUrl || (process.env.NODE_ENV === 'test' ? 'test-url' : 'prod-url');
```

**Configuration Standards Rules:**

- ✅ **Defaults in config structure** - All defaults defined in domain config builders
- ✅ **Single source of truth** - One place to find and change defaults
- ✅ **Trust configuration system** - No defensive fallbacks in business logic  
- ✅ **Environment separation** - Environment-specific defaults only in config builders
- ✅ **Clean access patterns** - Direct object access, no optional chaining with fallbacks

## Scripts Architecture Standards

### CRITICAL: Domain-Driven Scripts with Shared Infrastructure

**All scripts follow Domain-Driven Design (DDD) principles with clear separation between shared infrastructure domains and business domains:**

```bash
scripts/
├── core/           # Shared infrastructure (environment, hash, script framework)
├── format/         # Shared infrastructure (formatting, display, messaging)
├── build/          # Business domain (build processes)
├── deploy/         # Business domain (deployment processes)
└── test/           # Business domain (testing processes)
```

### Shared Infrastructure Domains

**Shared infrastructure domains** provide reusable utilities used across multiple business domains:

#### Core Domain (`scripts/core/`)

- **Purpose**: Environment detection, script framework, hash operations
- **Usage**: Used by all business domains for basic infrastructure
- **Contents**: Environment detection, script execution framework, file operations

#### Format Domain (`scripts/format/`)

- **Purpose**: Consistent formatting, display, and messaging across all scripts
- **Usage**: Used by all business domains for output formatting
- **Contents**: Message templates, display formatting, script lifecycle formatting

### Business Domains

**Business domains** focus on specific business processes:

#### Build Domain (`scripts/build/`)

- **Purpose**: Build processes and artifact generation
- **Workflows**: App building, frontend generation, mesh generation

#### Deploy Domain (`scripts/deploy/`)

- **Purpose**: Deployment processes and environment management
- **Workflows**: App deployment, mesh deployment

#### Test Domain (`scripts/test/`)

- **Purpose**: Testing processes and validation
- **Workflows**: Action testing, API testing, performance testing

### Scripts Domain Structure

Each domain follows the same DDD hierarchy:

```bash
domain/
├── workflows/      # High-level orchestration (business logic)
├── operations/     # Mid-level processes (domain operations)
└── utils/          # Low-level utilities (pure functions)
```

### CRITICAL: Format Domain Eliminates Formatting Pollution

**Before Format Domain (Problematic):**

```bash
scripts/
├── core/operations/formatting.js          # Mixed concerns
├── build/operations/output-templates.js   # Duplicate formatting
├── deploy/operations/output-templates.js  # Duplicate formatting
└── test/operations/display-formatting.js  # Duplicate formatting
```

**After Format Domain (Clean):**

```bash
scripts/
├── format/                    # Centralized formatting
│   ├── workflows/            # Complex formatting scenarios
│   ├── operations/           # Formatting operations and templates
│   └── utils/                # Basic formatters and constants
├── build/                    # Clean business domain
├── deploy/                   # Clean business domain
└── test/                     # Clean business domain
```

### Scripts Import Standards

**✅ CORRECT: Import from shared infrastructure domains**

```javascript
// Import shared infrastructure
const core = require('../core');
const format = require('../format');

// Use format domain for all output
console.log(format.success('Operation completed'));
console.log(format.templates.build.start());

// Use core domain for infrastructure
const env = core.detectEnvironment();
const result = await core.executeScript('deploy', deployFunction, args);
```

**❌ WRONG: Import from business domains or scattered locations**

```javascript
// Don't import from other business domains
const { deploymentStep } = require('../deploy/operations');

// Don't use scattered formatting
const { outputTemplates } = require('./operations/output-templates');
```

### Scripts Dependency Rules

**Domain Dependencies:**

- ✅ Business domains can depend on shared infrastructure domains (core, format)
- ✅ Shared infrastructure domains can depend on each other (with care)
- ❌ Business domains should NOT depend on other business domains
- ❌ No circular dependencies allowed

### Format Domain Usage Patterns

**CRITICAL: Simple Consistent Pattern**

**ONE RULE: All format functions return strings. Always use `console.log()` to print.**

```javascript
const format = require('../format');

// Basic formatting - ALL RETURN STRINGS
console.log(format.success('Operation completed'));
console.log(format.error('Operation failed'));
console.log(format.warning('Warning message'));
console.log(format.info('Information'));

// Section formatting - RETURNS STRINGS
console.log(format.section('Deploying App Builder'));
console.log(format.header('Processing Files'));

// Lifecycle formatting - RETURNS STRINGS
console.log(await format.buildStart());
console.log(await format.buildDone());
console.log(await format.deployStart(environment));
console.log(await format.deployDone(environment));

// Mesh formatting - RETURNS STRINGS
console.log(await format.meshStart(environment));
console.log(await format.meshDone(environment));
console.log(format.meshUpdateStart());
console.log(format.meshPollingStart(pollInterval, maxChecks));

// Common operations - RETURNS STRINGS
console.log(format.verbose('Processing step 1...'));
console.log(format.step('Environment validated'));
```

**Why This Pattern:**

- ✅ **Zero cognitive load** - Same pattern everywhere, no memorization required
- ✅ **Industry standard** - How most successful logging libraries work
- ✅ **Pure functions** - Easy to test, compose, and reason about
- ✅ **Flexible** - Can redirect output, save to files, use in tests
- ✅ **Clear separation** - Formatting vs output are separate concerns

**❌ WRONG: Mixed patterns (eliminated)**

```javascript
// Don't mix string returners and direct printers
console.log(format.error('message'));  // String returner
format.verbose('message');             // Direct printer (REMOVED)
```

### Scripts Architecture Benefits

**1. Single Responsibility**

- Each domain focuses on its core business logic
- No formatting pollution in business domains

**2. Centralized Formatting**

- All formatting concerns in format domain
- Consistent iconography and color usage
- Single place to update formatting standards

**3. Reusable Patterns**

- Format workflows shared across all domains
- Clean dependencies between domains
- Easy maintenance and updates

**4. Clean Domain Boundaries**

- Business domains depend on shared infrastructure
- No cross-domain business dependencies
- Clear separation of concerns

### Scripts Migration Guidelines

**When moving formatting from business domains to format domain:**

1. **Identify formatting logic** in business domains
2. **Extract to format domain** at appropriate level (utils/operations/workflows)
3. **Update imports** in business domains to use format domain
4. **Remove duplicate formatting** from business domains
5. **Test functionality** to ensure no regressions

**Example Migration:**

```javascript
// OLD: Mixed patterns (confusing)
// scripts/deploy/workflows/app-deployment.js
console.log(format.error('Build failed'));     // String returner
format.verbose('Starting mesh update...');     // Direct printer
console.log(await format.buildStart());        // String returner
format.section('Deploying App Builder');       // Direct printer

// NEW: Consistent pattern (simple)
// scripts/deploy/workflows/app-deployment.js
const format = require('../../format');

console.log(format.error('Build failed'));
console.log(format.verbose('Starting mesh update...'));
console.log(await format.buildStart());
console.log(format.section('Deploying App Builder'));

// ALL functions return strings, ALWAYS use console.log() to print
```

### Scripts Standards Compliance

**Before approving any script changes, verify:**

- [ ] **Uses shared infrastructure domains** (core, format)
- [ ] **No formatting in business domains** (use format domain)
- [ ] **Follows DDD hierarchy** (workflows → operations → utils)
- [ ] **Clean domain dependencies** (no cross-business-domain imports)
- [ ] **Consistent formatting patterns** (format domain usage)
- [ ] **Proper domain organization** (infrastructure vs business separation)

---

This refactoring standard ensures all actions follow the clean orchestrator pattern with domain-driven workflows, eliminating duplication while maintaining high code quality and consistency.
