# Adobe App Builder - Comprehensive Architecture Standards

## Purpose

This document consolidates all architectural standards for the Adobe App Builder Commerce integration application. It serves as the single source of truth for development patterns, replacing and superseding all other architectural documentation.

**Sources Consolidated:**

- ✅ REFACTORING-STANDARDS.md (1,563 lines) - Core principles and action framework
- ✅ SCRIPTS-REFACTORING-PLAN.md (199 lines) - Feature-First DDD for scripts  
- ✅ ARCHITECTURE-MIGRATION-PLAN.md (442 lines) - Implementation status and guidelines

---

## Core Architecture Principles

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
- Use direct imports with clear domain organization
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

---

## Domain Structure Standards: DDD + Feature-First

### CRITICAL: Domain Boundaries + Feature Cohesion

**Domain boundaries remain sacred** (DDD principle), but **features are organized for cognitive efficiency** within each domain.

**Core Principle:** Each file represents a **complete business capability** with composite → atomic organization internally.

### Main Application (`src/`)

```text
src/
├── products/                   # Product domain (DDD bounded context)
│   ├── rest-export.js         # Complete REST API export feature
│   ├── mesh-export.js         # Complete API Mesh export feature  
│   ├── product-enrichment.js  # Complete product enrichment feature
│   └── shared/                # Only truly shared utilities
│       ├── csv-generation.js  # Cross-feature CSV utilities
│       ├── data-validation.js # Cross-feature validation
│       ├── image-processing.js # Cross-feature image utilities
│       └── errors.js          # Domain-specific error handling
├── files/                     # File operations domain (DDD bounded context)
│   ├── csv-export.js          # Complete CSV export capability
│   ├── file-browser.js        # Complete file browsing capability
│   ├── file-download.js       # Complete file download capability
│   ├── file-deletion.js       # Complete file deletion capability
│   └── shared/                # Only truly shared utilities
│       ├── storage-strategies.js # Cross-feature storage selection
│       ├── presigned-urls.js  # Cross-feature URL generation
│       ├── path-utilities.js  # Cross-feature path processing
│       └── errors.js          # Domain-specific error handling
├── htmx/                      # HTMX domain (DDD bounded context)
│   ├── file-browser-ui.js     # Complete file browser UI feature
│   ├── modal-interactions.js  # Complete modal interaction feature
│   ├── notification-system.js # Complete notification feature
│   └── shared/                # Only truly shared utilities
│       ├── html-generation.js # Cross-feature HTML utilities
│       ├── response-building.js # Cross-feature HTMX responses
│       └── errors.js          # Domain-specific error handling
├── commerce/                  # Commerce integration domain (DDD bounded context)
│   ├── product-fetching.js    # Complete product fetching feature
│   ├── category-enrichment.js # Complete category enrichment feature
│   ├── inventory-enrichment.js # Complete inventory enrichment feature
│   ├── admin-token-auth.js    # Complete admin token authentication feature
│   └── shared/                # Only truly shared utilities
│       ├── api-client.js      # Cross-feature API client
│       ├── request-batching.js # Cross-feature batching
│       └── errors.js          # Domain-specific error handling
└── shared/                    # Cross-domain infrastructure utilities
    ├── action/               # Action framework infrastructure
    │   └── operations/
    │       └── action-factory.js # Complete action framework capability
    ├── errors/               # Error handling infrastructure
    │   ├── types.js          # Core error type definitions
    │   ├── factory.js        # Error creation utilities
    │   ├── handling.js       # Error processing logic
    │   ├── recovery.js       # Retry and recovery strategies
    │   ├── responses.js      # HTTP error response formatting
    │   └── operations/
    │       ├── classification.js # Error type classification
    │       ├── enhancement.js # Error context enhancement
    │       └── transformation.js # Error format transformation
    ├── http/                 # HTTP client infrastructure
    │   ├── client.js         # Complete HTTP client capability
    │   └── responses.js      # HTTP response utilities
    ├── routing/              # URL management infrastructure
    │   └── operations/
    │       ├── runtime.js    # Runtime URL building
    │       └── commerce.js   # Commerce URL building
    ├── validation/           # Validation infrastructure
    │   └── operations/
    │       ├── parameters.js # Parameter validation
    │       └── product.js    # Product validation
    └── utils/                # Universal utilities
        └── operations/
            ├── formatting.js # Universal formatting utilities
            └── async.js      # Universal async utilities
```

### Feature Organization Principles

**1. Domain Boundaries (DDD)**

- Each domain represents a distinct business context
- No cross-domain dependencies except through well-defined interfaces
- Domains can evolve independently

**2. Feature Cohesion**

- Each file contains a complete business capability
- Related workflows, operations, and utilities grouped together
- No file jumping required to understand one feature

**3. Composite → Atomic Ordering**

- Within each feature file: business workflows → operations → utilities
- Complexity decreases as you read down the file
- Dependencies flow downward within the file

**4. Shared Utilities Strategy**

- `shared/` directory only for truly cross-feature utilities
- Prefer feature-specific utilities within feature files
- Shared utilities must serve 3+ features within the domain

### Feature File Structure Standards

**CRITICAL: Each feature file follows this exact template:**

```javascript
/**
 * [Domain] [Feature Name]
 *
 * Complete [feature description] capability with all supporting functions
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { formatStepMessage } = require('../../shared/utils/operations/formatting');
const { response } = require('../../shared/http/responses');
const { createError } = require('../../shared/errors/factory');

// === DOMAIN DEPENDENCIES ===
const { createDomainError } = require('./shared/errors');
const { sharedDomainUtility } = require('./shared/utilities');

// === CROSS-DOMAIN DEPENDENCIES ===
const { crossDomainFeature } = require('../other-domain/feature-name');

// === BUSINESS WORKFLOWS === (Composite - Actions use these directly)

/**
 * [Main workflow description]
 * Used by: [specific actions or features]
 * @param {Type} param - Description
 * @returns {Promise<Type>} Description
 */
async function mainBusinessWorkflow() {
  // Step 1: [High-level business step]
  const step1Message = formatStepMessage('operation', 'success');
  const result1 = await coordinatingOperation();
  
  // Step 2: [Next business step]  
  const result2 = await crossDomainFeature();
  
  // Step 3: [Final business step]
  return response.success({ result1, result2 }, 'Operation completed successfully', {
    steps: [step1Message]
  });
}

// === FEATURE OPERATIONS === (Mid-level - Coordinate business logic)

/**
 * [Operation description]
 * Used by: [workflows within this feature]
 * @param {Type} param - Description
 * @returns {Promise<Type>} Description
 */
async function coordinatingOperation() {
  // Step 1: [Coordination step]
  const prepared = await prepareSomething();
  
  // Step 2: [Process step]
  return await processWithUtility(prepared);
}

// === FEATURE UTILITIES === (Atomic - Building blocks for this feature)

/**
 * [Utility description]
 * Used by: [operations within this feature]
 * @param {Type} param - Description
 * @returns {Type} Description
 */
function featureSpecificUtility() {
  // Simple, focused implementation
}

module.exports = {
  // Business workflows (what other files import)
  mainBusinessWorkflow,
  
  // Feature operations (rarely imported, but available)
  coordinatingOperation,
  
  // Feature utilities (internal, but exportable if needed)
  featureSpecificUtility,
};
```

### Feature File Guidelines

**File Size and Splitting Rules:**

1. **Target Size**: 150-400 lines per feature file
2. **Maximum Size**: 600 lines before mandatory split
3. **Split Triggers**:
   - Multiple distinct business workflows (2+ main workflows)
   - Cross-cutting concerns that serve other features
   - Utility functions used by 3+ features within domain

**When to Split Features:**

```javascript
// ✅ KEEP TOGETHER: Related business capability
// csv-export.js - All CSV export functionality
exportCsvWithStorage()     // Main workflow
storeCsvFile()            // Supporting operation  
validateCsvData()         // Supporting utility

// ✅ SPLIT: Distinct business capabilities  
// csv-export.js - CSV export capability
// file-browser.js - File browsing capability
// file-download.js - File download capability

// ✅ SPLIT TO SHARED: Used by 3+ features
// shared/storage-strategies.js - Storage provider selection
// shared/presigned-urls.js - URL generation utilities
```

**Import/Export Patterns:**

```javascript
// ✅ CORRECT: Feature imports shared utilities
const { selectStorageStrategy } = require('./shared/storage-strategies');
const { formatStepMessage } = require('../shared/utils/operations/formatting');

// ✅ CORRECT: Actions import main workflows
const { exportCsvWithStorage } = require('../files/csv-export');

// ❌ WRONG: Cross-domain direct imports (violates DDD)
const { storeCsvFile } = require('../files/csv-export'); // Should use interface

// ❌ WRONG: Deep operation imports (violates encapsulation)
const { validateCsvData } = require('../files/csv-export'); // Use workflow instead
```

### Cognitive Load Benefits

**Traditional Layer-First Problems:**

- 🔴 File jumping: workflows → operations → utilities → back to workflows
- 🔴 Context switching: Hold multiple files in working memory
- 🔴 Feature fragmentation: Related logic scattered across files

**Feature-First Solutions:**

- ✅ **Complete understanding**: Entire feature in one place
- ✅ **Progressive disclosure**: Workflows → operations → utilities in reading order
- ✅ **Reduced cognitive load**: No file jumping for feature comprehension
- ✅ **Better debugging**: Trace complete workflows in single file
- ✅ **Preserved DDD**: Domain boundaries still enforced

### Scripts (`scripts/`)

```text
scripts/
├── deployment/              # Deployment domain (Feature-First DDD)
│   ├── app-deployment.js   # Complete app deployment feature
│   ├── mesh-deployment.js  # Complete mesh deployment feature
│   └── shared/             # Only truly shared deployment utilities
│       ├── environment-detection.js
│       ├── output-formatting.js
│       └── url-building.js
├── testing/                # Testing domain (Feature-First DDD)
│   ├── action-testing.js   # Complete action testing feature
│   ├── performance-testing.js # Complete performance testing feature
│   ├── api-testing.js      # Complete API testing feature
│   └── shared/             # Only truly shared testing utilities
│       ├── test-execution.js
│       ├── result-formatting.js
│       └── parameter-handling.js
├── monitoring/             # Monitoring domain (Feature-First DDD)
│   ├── runtime-monitoring.js # Complete runtime monitoring feature
│   ├── error-monitoring.js  # Complete error monitoring feature
│   └── shared/             # Only truly shared monitoring utilities
│       ├── status-checking.js
│       └── alert-formatting.js
├── development/            # Development domain (Feature-First DDD)
│   ├── code-auditing.js    # Complete code audit feature
│   ├── dependency-analysis.js # Complete dependency analysis feature
│   └── shared/             # Only truly shared development utilities
│       └── file-scanning.js
└── shared/                 # Cross-domain infrastructure
    ├── cli/               # CLI infrastructure
    │   ├── args.js        # CLI argument parsing
    │   └── formatting.js  # CLI output formatting
    ├── execution/         # Script execution infrastructure
    │   └── script-framework.js # Complete script execution framework
    └── utils/             # Universal utilities
        ├── environment.js # Environment detection utilities
        └── async.js       # Universal async utilities
```

---

## Three-Tiered Shared Function Strategy

### CRITICAL: Strategic Approach to Code Reuse

The application uses a **three-tiered hierarchy** for shared functions that balances **cognitive efficiency** with **DDD principles** while preventing excessive duplication.

### Tier Definitions

#### **Tier 1: `src/shared/` (Cross-Domain Utilities)**

**Purpose:** Utilities used by **3+ domains** across the entire application.

**Examples:**

- Error handling infrastructure (`errors/types.js`, `errors/factory.js`, `errors/recovery.js`)
- HTTP client utilities (`http/client.js`)
- Generic validation functions (`validation/operations/`)
- URL building utilities (`routing/operations/`)
- Action framework (`action/operations/`)
- Universal formatting (`utils/operations/formatting.js`)

**Import Pattern:**

```javascript
// Cross-domain imports from shared infrastructure
const { buildRuntimeUrl } = require('../../shared/routing/operations/runtime');
const { formatStepMessage } = require('../../shared/utils/operations/formatting');
const { createAction } = require('../../shared/action/operations/action-factory');
```

#### **Tier 2: `domain/shared/` (Domain-Shared Utilities)**

**Purpose:** Utilities used by **3+ features** within a single domain.

**Examples:**

- `files/shared/errors.js` - File domain error types and creation functions
- `files/shared/storage-core.js` - Storage operations used by CSV export, file browser, and presigned URLs
- `products/shared/csv-generation.js` - CSV utilities used by REST export and mesh export
- `commerce/shared/errors.js` - Commerce domain error types and API error handling
- `commerce/shared/api-client.js` - Commerce API client used by multiple integration features

**Import Pattern:**

```javascript
// Domain-shared imports within same domain
const { storeCsvFile } = require('./shared/storage-core');
const { validateFilePath } = require('./shared/validation');
```

#### **Tier 3: Feature Files (Feature-Specific Utilities)**

**Purpose:** Utilities used by **1-2 features** or highly domain-specific logic.

**Strategy:** Keep utilities **inline within feature files** using composite → atomic organization.

**Examples:**

```javascript
// csv-export.js (Complete feature file)

// === BUSINESS WORKFLOWS === (Composite)
async function exportProductsAsCsv(products, config) { /* workflows */ }

// === FEATURE OPERATIONS === (Mid-level)  
async function prepareCsvData(products, config) { /* operations */ }

// === FEATURE UTILITIES === (Atomic)
function formatCsvHeaders(fields) { /* feature-specific utility */ }
function escapeCsvValue(value) { /* feature-specific utility */ }
function createCsvExportError(stage, error, context) { /* feature-specific error handling */ }
function handleCsvExportError(error, context) { /* feature-specific error recovery */ }
```

### Decision Tree for Shared Functions

```
Does function serve multiple domains?
├── YES → Is it used by 3+ domains?
│   ├── YES → src/shared/ (Tier 1)
│   └── NO → Allow controlled duplication or create domain/shared/ (Tier 2)
└── NO → Is it used by 3+ features in same domain?
    ├── YES → domain/shared/ (Tier 2)  
    └── NO → Keep in feature file (Tier 3)
```

### Extraction Rules

#### **Extract to Tier 1 (`src/shared/`)** When

- ✅ Function is used by **3+ domains**
- ✅ Function is **10+ lines** of complex logic
- ✅ Function provides **infrastructure** (HTTP, validation, routing, error handling)
- ✅ Function is **truly generic** (no domain-specific logic)
- ✅ Function handles **cross-domain concerns** (error types, retry strategies, response formatting)

#### **Extract to Tier 2 (`domain/shared/`)** When

- ✅ Function is used by **3+ features** within same domain
- ✅ Function is **20+ lines** of domain-specific logic
- ✅ Function coordinates **cross-feature operations**
- ✅ Function contains **domain business rules**
- ✅ Function handles **domain-specific errors** (commerce API errors, file operation errors)

#### **Keep in Feature File (Tier 3)** When

- ✅ Function is used by **1-2 features**
- ✅ Function is **< 20 lines**
- ✅ Function is **highly feature-specific**
- ✅ Extraction would **increase cognitive load**
- ✅ Function handles **feature-specific errors** (workflow context, step tracking, user messaging)

### Controlled Duplication Guidelines

**✅ ALLOW Duplication When:**

- Utility is **< 10 lines** and serves different domains
- Logic is **domain-specific** even if similar
- Shared abstraction would require **file jumping** to understand

**❌ PREVENT Duplication When:**

- Complex logic (**30+ lines**) used across domains
- Identical business logic across features
- Infrastructure utilities (formatting, HTTP, validation)

### Import Patterns

**CRITICAL: All imports must follow the organized pattern at the top of files (see Import Organization Standard above).**

#### **Complete Import Organization Example**

```javascript
/**
 * Example Feature File
 * Complete capability demonstrating organized imports and three-tier hierarchy
 */

// === INFRASTRUCTURE DEPENDENCIES === (Tier 1: Cross-domain utilities)
const { createError, ErrorType } = require('../../shared/errors/factory');
const { withRetry } = require('../../shared/errors/recovery');
const { buildRuntimeUrl } = require('../../shared/routing/operations/runtime');
const { validateActionParams } = require('../../shared/validation/operations/parameters');
const { formatStepMessage } = require('../../shared/utils/operations/formatting');

// === DOMAIN DEPENDENCIES === (Tier 2: Domain-shared utilities)
const { createFileError } = require('./shared/errors');
const { storeCsvFile } = require('./shared/storage-core');
const { generatePresignedUrl } = require('./shared/presigned-urls');

// === CROSS-DOMAIN DEPENDENCIES === (Tier 3: Feature interfaces)
const { exportProductsAsCsv } = require('../products/csv-export');
const { authenticateWithAdminToken } = require('../commerce/admin-token-auth');
// === BUSINESS WORKFLOWS ===
async function exampleWorkflow() {
  // All dependencies immediately visible at top of file
  const step = formatStepMessage('operation', 'success'); // Infrastructure
  const storage = await storeCsvFile(data, config); // Domain 
  return authenticateWithAdminToken(credentials); // Cross-domain
}
```

#### **Deprecated Import Patterns (Update These)**

```javascript
// ❌ WRONG: Old core/ imports (use shared/)
const { buildRuntimeUrl } = require('../../core/routing/operations/runtime');

// ❌ WRONG: Layer-first utility imports (use feature imports)
const { formatCsvHeaders } = require('./csv-export/utils/formatting');

// ❌ WRONG: Inline imports (move to top)
async function someFunction() {
  const { helperFunction } = require('./helpers'); // Move to top!
}

// ❌ WRONG: Non-destructured imports (use destructuring)
const csvExport = require('./csv-export');
const { exportProductsAsCsv } = csvExport; // Combine into one line
```

### Migration from `core/` to `shared/`

**CRITICAL CHANGE:** All references to `src/core/` must be updated to `src/shared/` for semantic clarity.

**Before (Old Pattern):**

```javascript
const { createAction } = require('../../src/shared/action/operations/action-factory');
const { formatStepMessage } = require('../../shared/utils/operations/formatting');
```

**After (New Pattern):**

```javascript
const { createAction } = require('../../src/shared/action/operations/action-factory');
const { formatStepMessage } = require('../../shared/utils/operations/formatting');
```

**Semantic Benefits:**

- ✅ **Clear purpose**: `shared/` indicates utilities shared across domains
- ✅ **Consistent hierarchy**: `src/shared/` and `domain/shared/` follow same pattern  
- ✅ **Future-proof**: Leaves `core/` available for true business domain logic
- ✅ **Self-documenting**: New developers immediately understand the purpose

### Benefits of Three-Tiered Approach

#### **Cognitive Efficiency:**

- ✅ **Complete features** in single files (no file jumping)
- ✅ **Clear sharing boundaries** (3+ usage rule)
- ✅ **Smart duplication** for tiny utilities (< 10 lines)
- ✅ **Predictable structure** (always know where to find things)

#### **Maintainability:**

- ✅ **DDD domain boundaries** preserved
- ✅ **Controlled sharing** with clear extraction rules
- ✅ **Refactoring clarity** (extract when usage grows)
- ✅ **Dependency management** (clear import hierarchy)

#### **Code Quality:**

- ✅ **Reduced circular dependencies** (clear hierarchy)
- ✅ **Easy testing** (feature files are self-contained)
- ✅ **Simple debugging** (trace features without file jumping)
- ✅ **Strategic duplication** (reduces abstraction overhead)

---

## Action Framework Standards

### CRITICAL: Always Use Action Framework

**ALL actions must use the action framework**. Never create actions that bypass `createAction()`:

```javascript
/**
 * Action Name
 * Business logic for action-name
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../src/shared/action/operations/action-factory');

// === CROSS-DOMAIN DEPENDENCIES ===
const { exportProductsAsCsv } = require('../files/csv-export');
const { fetchAndEnrichProducts } = require('../commerce/product-fetching');

async function actionBusinessLogic(context) {
  const { config, extractedParams } = context;
  
  // Step 1: Fetch and enrich data
  const products = await fetchAndEnrichProducts(extractedParams, config);
  
  // Step 2: Export as CSV
  return await exportProductsAsCsv(products, config);
}

module.exports = createAction(actionBusinessLogic, {
  actionName: 'action-name',
  withTracing: false,
  withLogger: false,
  description: 'Action description'
});

// ❌ WRONG: Manual action creation (bypass framework)
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

// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../shared/action/operations/action-factory');

// === CROSS-DOMAIN DEPENDENCIES ===
const { domainFunction } = require('../../domain/feature-name');

async function actionBusinessLogic(context) {
  const { core, config, extractedParams } = context;
  const steps = [];

  // Step 1: Input validation handled by framework
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Domain operation
  const result = await domainFunction(extractedParams, config);
  steps.push(core.formatStepMessage('operation-name', 'success', { data: result }));

  return {
    message: 'Operation completed successfully',
    steps,
    result
  };
}

module.exports = createAction(actionBusinessLogic, {
  actionName: 'action-name',
  description: 'Action description'
});
```

**Required Elements:**

- ✅ **Step-based workflow** with `steps` array
- ✅ **Consistent messaging** with `core.formatStepMessage()`
- ✅ **Direct imports** for domain functions
- ✅ **Single return point** with proper response structure
- ✅ **Clean destructuring** from context
- ✅ **Step comments** for workflow clarity (see Workflow Step Comments below)

### Action Length Guidelines

- **Target**: 40-60 lines for action `index.js` files
- **Maximum**: 80 lines before extracting to domain workflows
- **Split Required**: When action has multiple distinct responsibilities

### Domain Function Requirements

**Actions MUST call domain functions, never implement business logic:**

```javascript
/**
 * Example Action with Domain Function Calls
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../shared/action/operations/action-factory');

// === CROSS-DOMAIN DEPENDENCIES ===
const { fetchAndEnrichProducts } = require('../../commerce/product-fetching');
const { createCsv } = require('../../products/csv-generation');
const { storeCsvFile } = require('../../files/csv-export');

// ✅ CORRECT: Call domain functions using direct imports
async function actionBusinessLogic(context) {
  const { config, extractedParams } = context;
  
  const data = await fetchAndEnrichProducts(extractedParams, config);
  const csv = await createCsv(data, config);
  const storage = await storeCsvFile(csv, config, extractedParams);
  
  return { data, csv, storage };
}

// ❌ WRONG: Implement business logic in action
async function badActionBusinessLogic(context) {
  // 50 lines of product fetching logic
  // 30 lines of transformation logic
  // 20 lines of CSV generation logic
}
```

---

## Function Standards

### Length Guidelines

- **Target**: 10-40 lines for most functions
- **Acceptable**: Up to 60 lines if genuinely single responsibility
- **Split Required**: When function handles multiple distinct concerns

### Single Responsibility Rule

- Each function should do ONE thing well
- Function name should clearly indicate its purpose
- **Test**: Can you explain what this function does in one sentence?

### Parameter Clarity

- Parameters should be explicit and self-documenting
- Avoid mysterious objects with unclear contents
- **Test**: Are the required inputs obvious from the function signature?

---

## Three-Tiered Error Handling Strategy

### CRITICAL: Comprehensive Error Management

The application uses a **three-tiered error handling system** that provides **cross-domain infrastructure**, **domain-specific semantics**, and **feature-specific context** while maintaining cognitive efficiency and DDD principles.

### Error Handling Tiers

#### **Tier 1: `src/shared/errors/` (Cross-Domain Error Infrastructure)**

**Purpose:** Core error infrastructure used by all domains for consistent error handling.

**Components:**

```javascript
// src/shared/errors/types.js - Core error type definitions
const ErrorType = {
  // Infrastructure errors (cross-domain)
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR', 
  CONFIGURATION: 'CONFIGURATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  FILE_SYSTEM: 'FILE_SYSTEM_ERROR',
  
  // Action framework errors
  INITIALIZATION: 'INITIALIZATION_ERROR',
  PARAMETER: 'PARAMETER_ERROR',
  RUNTIME: 'RUNTIME_ERROR'
};

// src/shared/errors/factory.js - Error creation utilities
function createError(type, message, context = {}) {
  return {
    type,
    message,
    context,
    timestamp: new Date().toISOString(),
    isRetryable: determineRetryability(type, context),
    suggestedAction: generateSuggestedAction(type, context)
  };
}

// src/shared/errors/recovery.js - Retry and recovery strategies  
function createRetryStrategy(errorType, maxRetries = 3) {
  return {
    shouldRetry: (error, attempt) => error.isRetryable && attempt < maxRetries,
    getDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
    beforeRetry: (error, attempt) => logRetryAttempt(error, attempt)
  };
}
```

**Cross-Domain Error Patterns:**

```javascript
/**
 * Example API Request Feature
 * Complete API request capability with error handling
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createError, ErrorType } = require('../../shared/errors/factory');
const { withRetry } = require('../../shared/errors/recovery');

// === BUSINESS WORKFLOWS ===
async function makeApiRequest(url, options) {
  try {
    return await withRetry(() => fetch(url, options), {
      errorType: ErrorType.NETWORK,
      maxRetries: 3
    });
  } catch (error) {
    throw createError(ErrorType.NETWORK, `API request failed: ${error.message}`, {
      url,
      originalError: error
    });
  }
}
```

#### **Tier 2: `domain/shared/errors.js` (Domain Error Specifications)**

**Purpose:** Domain-specific error types and enhanced context for business operations.

**Examples:**

```javascript
// files/shared/errors.js - File domain error specifications
const { createError, ErrorType } = require('../../shared/errors/factory');

const FileErrorType = {
  STORAGE_FAILED: 'FILE_STORAGE_FAILED',
  DOWNLOAD_FAILED: 'FILE_DOWNLOAD_FAILED', 
  VALIDATION_FAILED: 'FILE_VALIDATION_FAILED',
  PRESIGNED_URL_FAILED: 'PRESIGNED_URL_FAILED'
};

function createFileError(operation, originalError, context = {}) {
  return createError(ErrorType.FILE_SYSTEM, 
    `File ${operation} failed: ${originalError.message}`, {
    operation,
    originalError,
    fileContext: context,
    canRetry: operation !== 'validation',
    suggestedAction: generateFileErrorAction(operation, originalError)
  });
}

// commerce/shared/errors.js - Commerce domain error specifications
const CommerceErrorType = {
  API_REQUEST_FAILED: 'COMMERCE_API_FAILED',
  PRODUCT_ENRICHMENT_FAILED: 'PRODUCT_ENRICHMENT_FAILED',
  ADMIN_TOKEN_FAILED: 'COMMERCE_ADMIN_TOKEN_FAILED'
};

function createCommerceError(apiOperation, originalError, context = {}) {
  const isAuthError = originalError.message.includes('401') || 
                     originalError.message.includes('Unauthorized');
  
  return createError(ErrorType.NETWORK,
    `Commerce ${apiOperation} failed: ${originalError.message}`, {
    apiOperation,
    originalError, 
    commerceContext: context,
    canRetry: !isAuthError,
    suggestedAction: isAuthError 
      ? 'Check admin credentials in .env file'
      : 'Verify network connectivity and retry'
  });
}
```

**Domain Error Patterns:**

```javascript
/**
 * Files Upload Feature
 * Complete file upload capability with domain error handling
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createError, ErrorType } = require('../../shared/errors/factory');

// === DOMAIN DEPENDENCIES ===
const { createFileError } = require('./shared/errors');

// === BUSINESS WORKFLOWS ===
async function uploadFile(file, destination) {
  try {
    return await storage.upload(file, destination);
  } catch (error) {
    throw createFileError('upload', error, {
      fileName: file.name,
      destination,
      fileSize: file.size
    });
  }
}
```

#### **Tier 3: Feature Files (Feature Error Context)**

**Purpose:** Feature-specific error handling with complete context and recovery logic inline.

**Pattern:**

```javascript
/**
 * Files CSV Export
 * Complete CSV export feature with error handling and recovery logic
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { response } = require('../../shared/http/responses');

// === DOMAIN DEPENDENCIES ===
const { createFileError } = require('./shared/errors');
const { storeCsvFile } = require('./shared/storage-core');

// === BUSINESS WORKFLOWS ===
async function exportProductsAsCsv(products, config) {
  try {
    // Step 1: Validate products for CSV export
    const validation = validateProductsForCsv(products);
    if (!validation.isValid) {
      throw createCsvExportError('validation', validation.errors, {
        productCount: products.length,
        validationFailures: validation.failures
      });
    }
    
    // Step 2: Transform and export
    const csvData = transformProductsToCsv(products, config);
    return await storeCsvData(csvData, config);
  } catch (error) {
    return handleCsvExportError(error, { 
      feature: 'csv-export',
      productCount: products.length,
      stage: 'workflow'
    });
  }
}

// === FEATURE OPERATIONS ===
async function storeCsvData(csvData, config) {
  try {
    return await storeCsvFile(csvData, config);
  } catch (error) {
    throw createCsvExportError('storage', error, { 
      csvSize: csvData.length,
      storageProvider: config.storage.provider 
    });
  }
}

// === FEATURE UTILITIES ===
function createCsvExportError(stage, originalError, context = {}) {
  return createFileError('csv-export', originalError, {
    exportStage: stage,
    feature: 'csv-export',
    ...context
  });
}

function handleCsvExportError(error, context = {}) {
  // Feature-specific recovery logic
  const canRetry = error.type !== 'VALIDATION_ERROR';
  const suggestedAction = canRetry 
    ? 'Check storage configuration and retry'
    : 'Fix product data validation errors';
    
  // Return feature-specific error response
  return {
    success: false,
    error: {
      ...error,
      feature: 'csv-export',
      context,
      suggestedAction,
      steps: [`Failed at ${context.stage || 'unknown stage'}`]
    }
  };
}
```

### Error Handling Decision Rules

#### **Use Tier 1 (`src/shared/errors/`)** When

- ✅ Infrastructure errors (network, auth, config, file system)
- ✅ Cross-domain error utilities (retry logic, classification)
- ✅ Error type definitions used by multiple domains
- ✅ HTTP error response formatting

#### **Use Tier 2 (`domain/shared/errors.js`)** When

- ✅ Domain-specific error types and semantics
- ✅ Business rule validation errors  
- ✅ Domain context enhancement (commerce API context, file operation context)
- ✅ Error creation functions used by multiple features in domain

#### **Use Tier 3 (Feature Files)** When

- ✅ Feature-specific error handling and recovery
- ✅ Workflow error context and step tracking
- ✅ User-facing error messages with feature context
- ✅ Feature-specific retry and fallback logic

### Framework Integration

**Action Framework Error Handling:**

```javascript
// ✅ CORRECT: Let action framework handle final error responses
async function actionBusinessLogic(context) {
  // Business logic with domain/feature error handling
  const result = await exportProductsAsCsv(products, config);
  
  // Framework automatically handles error responses if result contains error
  return result;
}

// ❌ WRONG: Custom action-level error handling
async function actionBusinessLogic(context) {
  try {
    const result = await exportProductsAsCsv(products, config);
    return result;
  } catch (error) {
    // Framework already provides this - don't duplicate!
    return response.error(error);
  }
}
```

**Action Framework Benefits:**

- ✅ **Consistent error responses** across all actions
- ✅ **Automatic logging** of errors with context
- ✅ **Standardized HTTP status codes** based on error type
- ✅ **Development debugging** with stack traces in non-production

### Error Testing Patterns

**Tier 1 Testing:**

```javascript
// Test cross-domain error infrastructure
const { createError, ErrorType } = require('../../shared/errors/factory');

test('creates retryable network error', () => {
  const error = createError(ErrorType.NETWORK, 'Connection failed', {
    url: 'https://api.example.com'
  });
  
  expect(error.isRetryable).toBe(true);
  expect(error.suggestedAction).toContain('network');
});
```

**Tier 2 Testing:**

```javascript
// Test domain-specific error creation
const { createFileError } = require('./shared/errors');

test('creates file upload error with context', () => {
  const originalError = new Error('Disk full');
  const error = createFileError('upload', originalError, {
    fileName: 'test.csv',
    fileSize: 1024
  });
  
  expect(error.context.operation).toBe('upload');
  expect(error.context.fileName).toBe('test.csv');
});
```

**Tier 3 Testing:**

```javascript
// Test feature-specific error handling
test('handles CSV export validation errors', async () => {
  const invalidProducts = [{ /* missing required fields */ }];
  
  const result = await exportProductsAsCsv(invalidProducts, config);
  
  expect(result.success).toBe(false);
  expect(result.error.feature).toBe('csv-export');
  expect(result.error.suggestedAction).toContain('validation');
});
```

### Benefits of Three-Tiered Error Handling

#### **Cognitive Efficiency:**

- ✅ **Complete error context** in feature files (no file jumping)
- ✅ **Predictable patterns** (same structure across all features)  
- ✅ **Clear ownership** (know exactly where to handle each error type)

#### **DDD Compliance:**

- ✅ **Domain boundaries preserved** (commerce errors stay in commerce domain)
- ✅ **Shared infrastructure** (cross-domain error utilities)
- ✅ **Business context** (domain-specific error semantics)

#### **Maintainability:**

- ✅ **Single source of truth** for error types and handling
- ✅ **Consistent error responses** across all features
- ✅ **Easy testing** (mock errors at appropriate tier)
- ✅ **Clear upgrade path** (migrate existing scattered error handling)

### Meaningful Error Messages

**Error Message Standards:**

- ✅ **Explain what went wrong** AND **what the user should do**
- ✅ **Include context** about what operation failed
- ✅ **Provide recovery steps** when possible
- ✅ **Use consistent terminology** across domains

**Examples:**

```javascript
// ✅ GOOD: Specific, actionable error messages
"Commerce product fetch failed: Authentication token expired. Please check your admin credentials in the .env file and restart the application."

"CSV export failed during storage: S3 bucket 'exports' not accessible. Verify your AWS credentials and bucket permissions, then retry."

"File validation failed: Product data missing required 'sku' field in 15 of 119 products. Please ensure all products have valid SKU values before export."

// ❌ BAD: Vague, unhelpful error messages  
"Operation failed"
"Error occurred"
"Something went wrong"
```

---

## Code Organization Standards

### Import Patterns

**Use direct imports for all internal dependencies:**

```javascript
// ✅ CORRECT: Direct imports for Feature-First domain code
const { fetchAndEnrichProducts } = require('../../commerce/product-fetching');
const { authenticateWithAdminToken } = require('../../commerce/admin-token-auth');
const { enrichWithCategories } = require('../../products/product-enrichment');

// ❌ WRONG: Layer-first imports (deprecated)
const { executeAdminTokenCommerceRequest } = require('../../commerce/operations/api-requests');
const { buildProductsEndpoint } = require('../../commerce/utils/endpoint-builders');

// ❌ WRONG: Flat exports that obscure dependencies
const { fetchAndEnrichProducts, authenticateWithAdminToken } = require('../../commerce');
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

### Documentation Standards

**CRITICAL: Minimal Documentation Philosophy**

Code organization and clear function names should eliminate most documentation needs.

**What to Document:**

- ✅ **File purpose** - Brief header explaining domain and organization
- ✅ **Function contracts** - JSDoc with parameter types and return types
- ✅ **Usage context** - For workflows, note which actions use them
- ✅ **Complex business logic** - Only when the code itself isn't clear

**What NOT to Document:**

- ❌ **Step-by-step comments** - Code should be self-explanatory
- ❌ **Verbose descriptions** - Don't repeat what function names already say
- ❌ **Implementation details** - What the code does should be obvious from reading it
- ❌ **Architectural theory** - Group by practical usage, not abstract concepts

### File Organization Standards: Feature-First

**CRITICAL: All files must follow the Feature-First organization defined in Domain Structure Standards above.**

This replaces the old layer-first approach (workflows/, operations/, utils/) with feature-first organization for reduced cognitive load.

**File Header Pattern:**

```javascript
/**
 * [Domain] [Feature Name]
 *
 * Complete [feature description] capability with all supporting functions
 */
```

**Examples:**

- `Files CSV Export` - Complete CSV export capability with storage and validation
- `Products REST Export` - Complete REST API export feature with enrichment and transformation
- `Commerce Product Fetching` - Complete product fetching capability with batching and caching
- `Core Action Framework` - Complete action framework capability with initialization and execution

**Required Section Pattern:**

```javascript
// === BUSINESS WORKFLOWS === (Composite - Actions use these directly)
// === FEATURE OPERATIONS === (Mid-level - Coordinate business logic)
// === FEATURE UTILITIES === (Atomic - Building blocks for this feature)
```

**Section Descriptions:**

- `// === BUSINESS WORKFLOWS ===` - Main workflows that actions and other features use
- `// === FEATURE OPERATIONS ===` - Coordination logic that workflows use internally
- `// === FEATURE UTILITIES ===` - Building block functions for this specific feature

**JSDoc Pattern:**

```javascript
/**
 * [Brief function description]
 * Used by: [specific actions or workflows] (ALWAYS include for workflows)
 * @param {Type} param1 - Description
 * @param {Type} [param2=default] - Optional parameter
 * @returns {Promise<Type>} Return description
 */
```

**Export Organization Pattern:**

```javascript
module.exports = {
  // Business workflows (what other files import)
  mainWorkflow,
  secondaryWorkflow,
  
  // Feature operations (rarely imported, but available)
  coordinatingOperation,
  
  // Feature utilities (internal, but exportable if needed)
  featureUtility,
};
```

**File Organization Rules:**

1. **Feature-first naming** - File names represent complete business capabilities
2. **Complete feature cohesion** - No file jumping required to understand one feature
3. **Imports at top** - All dependencies organized at file beginning (see Import Organization Standard below)
4. **Composite → atomic sections** - Workflows → operations → utilities within each file
5. **JSDoc for all functions** - Include types and "Used by:" for workflows
6. **Step comments in workflows** - Clear step-by-step business logic flow
7. **Dependency flow downward** - Functions use functions defined below them
8. **Domain boundaries respected** - Features only import from shared/ or cross-domain interfaces

### Import Organization Standard

**CRITICAL: All imports must be organized at the top of every file for maximum discoverability and dependency analysis.**

**Standard Import Pattern:**

```javascript
/**
 * [Domain] [Feature Name]
 * Complete [feature description] capability with all supporting functions
 */

// === INFRASTRUCTURE DEPENDENCIES ===
// Cross-domain utilities (src/shared/) - Used by all domains
const { formatStepMessage } = require('../../shared/utils/operations/formatting');
const { response } = require('../../shared/http/responses');
const { createError } = require('../../shared/errors/factory');

// === DOMAIN DEPENDENCIES ===  
// Domain shared utilities (domain/shared/) - Used by multiple features in this domain
const { createFileError } = require('./shared/errors');
const { selectStorageStrategy } = require('./shared/storage-strategies');

// === CROSS-DOMAIN DEPENDENCIES ===
// Feature interfaces from other domains - Complete capabilities only
const { validateProductData } = require('../products/data-validation');
const { authenticateWithAdminToken } = require('../commerce/admin-token-auth');

// === BUSINESS WORKFLOWS ===
// Main workflows that actions and other features use

// === FEATURE OPERATIONS ===
// Coordination logic that workflows use internally  

// === FEATURE UTILITIES ===
// Building block functions for this specific feature
```

**Import Organization Benefits:**

✅ **Immediate Dependency Visibility** - All dependencies clear at file top  
✅ **Architecture Analysis** - Quickly assess coupling and dependency patterns  
✅ **Three-Tier Hierarchy** - Infrastructure → Domain → Cross-Domain dependencies visible  
✅ **Cognitive Efficiency** - No mental overhead tracking down imports  
✅ **Consistency** - Standard pattern across all files  
✅ **Tool Support** - Better IDE support, easier automated analysis

### Cognitive Load Benefits

**Traditional Layer-First Problems:**

- 🔴 File jumping: workflows → operations → utilities → back to workflows
- 🔴 Context switching: Hold multiple files in working memory
- 🔴 Feature fragmentation: Related logic scattered across files

**Feature-First Solutions:**

- ✅ **Complete understanding**: Entire feature in one place
- ✅ **Progressive disclosure**: Workflows → operations → utilities in reading order
- ✅ **Reduced cognitive load**: No file jumping for feature comprehension  
- ✅ **Better debugging**: Trace complete workflows in single file
- ✅ **Preserved DDD**: Domain boundaries still enforced

### Migration from Layer-First

**Old Layer-First Organization (DEPRECATED):**

```javascript
// ❌ OLD: Cognitive overhead from file jumping
files/
├── workflows/file-management.js    // Jump here for workflows
├── operations/storage-operations.js // Jump here for operations  
└── utils/path-utilities.js        // Jump here for utilities

// ❌ DEPRECATED: Multiple imports required for one feature (cognitive overhead)
const { exportCsvWithStorage } = require('../workflows/file-management');
const { storeCsvFile } = require('../operations/storage-operations');
const { validatePath } = require('../utils/path-utilities');
```

**New Feature-First Organization (REQUIRED):**

```javascript
// ✅ NEW: Cognitive efficiency from feature cohesion
files/
├── csv-export.js          // Complete CSV export feature
├── file-browser.js        // Complete file browsing feature
├── file-download.js       // Complete file download feature
└── shared/                # Only truly shared utilities
    └── storage-strategies.js

// ✅ FEATURE-FIRST: Single import for complete feature (cognitive efficiency)
const { exportCsvWithStorage } = require('../files/csv-export');
```

**Complete Feature File Example:**

```javascript
/**
 * Files CSV Export
 *
 * Complete CSV export capability with storage, validation, and error handling
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { formatStepMessage } = require('../../shared/utils/operations/formatting');
const { response } = require('../../shared/http/responses');
const { createError } = require('../../shared/errors/factory');

// === DOMAIN DEPENDENCIES ===
const { createFileError } = require('./shared/errors');
const { selectStorageStrategy } = require('./shared/storage-strategies');

// === CROSS-DOMAIN DEPENDENCIES ===
const { validateProductData } = require('../products/data-validation');

// === BUSINESS WORKFLOWS ===

/**
 * Complete CSV export with storage pipeline
 * Used by: get-products action, get-products-mesh action
 * @param {string} csvData - CSV content to export
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {string} [fileName] - Optional custom filename
 * @returns {Promise<Object>} Export result with storage info and download URL
 */
async function exportCsvWithStorage(csvData, config, params, fileName) {
  // Step 1: Store CSV file with configured storage provider
  const storageResult = await storeCsvFile(csvData, config, params, fileName);
  
  // Step 2: Build standardized export response
  return buildExportResponse(storageResult);
}

// === FEATURE OPERATIONS ===

/**
 * Store CSV file using configured storage strategy
 * Used by: exportCsvWithStorage workflow
 * @param {string} csvData - CSV content
 * @param {Object} config - Configuration object  
 * @param {Object} params - Action parameters
 * @param {string} [fileName] - Custom filename
 * @returns {Promise<Object>} Storage operation result
 */
async function storeCsvFile(csvData, config, params, fileName) {
  // Step 1: Prepare storage parameters
  const storageParams = prepareCsvStorageParams(csvData, fileName);
  
  // Step 2: Initialize storage provider
  const storage = await selectStorageStrategy(config.storage.provider, config, params);
  
  // Step 3: Execute storage operation
  return await storage.store(storageParams.fileName, storageParams.csvData);
}

// === FEATURE UTILITIES ===

/**
 * Prepare CSV storage parameters with filename generation
 * Used by: storeCsvFile operation
 * @param {string} csvData - CSV content
 * @param {string} [customFileName] - Optional custom filename
 * @returns {Object} Prepared storage parameters
 */
function prepareCsvStorageParams(csvData, customFileName) {
  return {
    csvData,
    fileName: customFileName || generateCsvFileName(),
    contentType: 'text/csv',
  };
}

function generateCsvFileName() {
  return `export-${Date.now()}.csv`;
}

module.exports = {
  // Business workflows (main exports)
  exportCsvWithStorage,
  
  // Feature operations (available if needed)
  storeCsvFile,
  
  // Feature utilities (internal, but exportable)
  prepareCsvStorageParams,
};
```

### Workflow Step Comments (MANDATORY)

**All workflow functions MUST include step comments that explain the logical flow:**

```javascript
// ✅ CORRECT: Clear step comments for workflow logic
async function exportProducts(params, config, trace = null) {
  // Step 1: Fetch and enrich products from Commerce API
  const enrichedProducts = await fetchAndEnrichProducts(params, config, trace);
  
  // Step 2: Transform products for export format
  const builtProducts = await buildProducts(enrichedProducts, config);
  
  // Step 3: Convert to CSV format
  const csvResult = await convertToCSV(builtProducts, config);

  return {
    productCount: builtProducts.length,
    csvSize: csvResult.length,
    csvContent: csvResult,
    products: builtProducts,
  };
}

// ❌ WRONG: No step comments make workflow hard to follow
async function exportProducts(params, config, trace = null) {
  const enrichedProducts = await fetchAndEnrichProducts(params, config, trace);
  const builtProducts = await buildProducts(enrichedProducts, config);
  const csvResult = await convertToCSV(builtProducts, config);
  // ...
}
```

**Step Comment Rules:**

- ✅ **Format**: `// Step N: Description of what this step accomplishes`
- ✅ **Logical grouping**: Each step represents a distinct phase of the workflow
- ✅ **Clear purpose**: Describes the business logic, not implementation details
- ✅ **Sequential numbering**: Step 1, Step 2, Step 3, etc.
- ✅ **Present in all workflows**: Required for any function with multiple logical phases

**When to Use Step Comments:**

- **Always in workflows** - Functions that orchestrate multiple operations
- **Complex operations** - Functions with 3+ distinct logical phases
- **Entry points** - Main business logic functions
- **Skip for simple functions** - Single-responsibility utility functions

---

## Configuration Standards: Feature-First DDD Integration

### CRITICAL: Configuration as Infrastructure Boundary

**Configuration sits at the infrastructure layer and flows into feature boundaries through dependency injection, maintaining clean separation between business logic and infrastructure concerns.**

### **Core Configuration Principles**

#### **1. Clean Configuration Pattern**

**The configuration system uses clean object access without defensive fallbacks:**

```javascript
// ✅ CORRECT: Clean configuration access
const config = loadConfig(params);
const timeout = config.commerce.api.timeout;
const { pageSize, maxPages } = config.commerce.product.pagination;
const fields = config.commerce.product.fields;

// ❌ WRONG: Defensive fallbacks in business logic
const timeout = config.commerce?.api?.timeout || 30000;
const pageSize = config.commerce?.product?.pagination?.pageSize || 100;
```

**Configuration Trust Rules:**

- ✅ **NO optional chaining (`?.`)** in business logic
- ✅ **NO fallback values (`|| defaultValue`)** in business logic  
- ✅ **Defaults belong in config files** - not scattered through code
- ✅ **Trust your configuration system** to provide complete data

#### **2. Configuration as Dependency Injection**

**Configuration flows through architecture layers via function parameters:**

```text
Action (loadConfig) 
  ↓ complete config object
Feature Workflow (extracts needed sections)
  ↓ complete config object  
Feature Operation (uses specific sections)
  ↓ targeted config sections
Feature Utility (pure functions)
```

### **Feature-First Configuration Integration**

#### **Configuration Boundaries in Feature-First Architecture**

**Feature workflows** should:

- ✅ Receive complete config object as parameter
- ✅ Extract only needed sections internally
- ✅ Pass relevant config sections to operations
- ❌ Never modify configuration
- ❌ Never load configuration themselves

**Feature operations** should:

- ✅ Receive targeted config sections from workflows
- ✅ Use config for business decisions only
- ❌ Never access global config directly
- ❌ Never perform environment detection

#### **Feature Workflow Configuration Pattern**

```javascript
// ✅ CORRECT: Feature workflow extracts needed config
async function exportProducts(params, config, trace = null) {
  // Feature accesses only what it needs from config
  const { commerce, products, storage } = config;
  
  // Pass relevant config sections to operations
  const enrichedProducts = await fetchAndEnrichProducts(params, config, trace);
  const builtProducts = await buildProducts(enrichedProducts, config);
  const csvResult = await convertToCSV(builtProducts, config);
  
  return { csvContent: csvResult, productCount: builtProducts.length };
}

// ❌ WRONG: Feature modifies or loads configuration
async function badExportProducts(params, trace = null) {
  const config = loadConfig(params); // Wrong - features don't load config
  config.commerce.timeout = 60000;   // Wrong - features don't modify config
}
```

#### **Configuration Extraction in Operations**

```javascript
// ✅ CORRECT: Operation extracts specific config sections
async function fetchProducts(params, config, trace = null) {
  // Extract only Commerce-related configuration
  const { baseUrl, api, batching } = config.commerce;
  
  // Use configuration for business decisions
  const batchSize = batching.products || 50;
  const timeout = api.timeout;
  
  return await makeCommerceRequest(baseUrl, { timeout, batchSize });
}

// ❌ WRONG: Operation accesses unrelated config sections
async function fetchProducts(params, config, trace = null) {
  const storageConfig = config.storage; // Wrong - not related to product fetching
  const uiConfig = config.ui;           // Wrong - backend operation accessing UI config
}
```

### **Domain Configuration Composition**

#### **Domain Builder Standards**

**Each domain manages its own configuration concerns:**

```javascript
// ✅ CORRECT: Commerce domain only knows Commerce config
function buildCommerceConfig(params = {}) {
  return {
    baseUrl: params.COMMERCE_BASE_URL || process.env.COMMERCE_BASE_URL || 'REQUIRED:COMMERCE_BASE_URL',
    api: { 
      version: 'V1',
      timeout: 30000 
    },
    batching: { 
      inventory: 50, 
      categories: 20 
    },
    paths: { 
      products: '/products', 
      categories: '/categories' 
    }
  };
}

// ✅ CORRECT: Files domain only knows Files config  
function buildFilesConfig(params, mainConfig) {
  return {
    storage: {
      csv: { 
        filename: mainConfig.csvFilename // Only shared business setting
      }
    },
    extensions: ['.csv', '.json'],
    contentTypes: { csv: 'text/csv' }
  };
}
```

#### **Configuration Environment Handling**

**Environment differences handled at domain builder level:**

```javascript
// ✅ CORRECT: Environment handling in domain builder
function buildCommerceConfig(params = {}) {
  const baseUrl = params.COMMERCE_BASE_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://prod.commerce.com' 
      : 'https://staging.commerce.com');
      
  return { 
    baseUrl, 
    api: { timeout: 30000 },
    retries: process.env.NODE_ENV === 'production' ? 5 : 3
  };
}

// ❌ WRONG: Environment detection in business logic
async function fetchProducts(params, config) {
  const retries = process.env.NODE_ENV === 'production' ? 5 : 3; // Wrong location
}
```

### **Configuration Structure Standards**

#### **Main Configuration Composition**

```javascript
// config/index.js - Main orchestrator
function loadConfig(params = {}, isProd = false) {
  const mainConfig = buildMainConfig();

  return {
    // 🏗️ BUSINESS DOMAINS (feature-relevant config)
    commerce: buildCommerceConfig(params),
    products: buildProductsConfig(),
    
    // 📁 STORAGE CONFIGURATION (cross-feature infrastructure)
    storage: {
      ...mainConfig.storage, // Include all storage config from main
      ...buildFilesConfig(params, mainConfig).storage, // File-specific settings
    },
    files: {
      extensions: buildFilesConfig(params, mainConfig).extensions,
      contentTypes: buildFilesConfig(params, mainConfig).contentTypes,
    },
    
    // 🔧 INFRASTRUCTURE DOMAINS (runtime/deployment config)
    runtime: buildRuntimeConfig(params, isProd),
    mesh: buildMeshConfig(params),
    
    // 🎨 UI DOMAIN (frontend-specific config)
    ui: buildUiConfig()
  };
}
```

#### **Configuration Builder Rules**

**Domain configuration builders use environment overrides appropriately:**

```javascript
// ✅ CORRECT: Configuration domain pattern (acceptable in config/ files)
function buildDomainConfig(params = {}) {
  return {
    // Static defaults in configuration structure
    timeout: 30000,
    retries: 3,
    
    // Environment overrides only in config builders
    baseUrl: params.API_BASE_URL || process.env.API_BASE_URL || 'REQUIRED:API_BASE_URL',
  };
}
```

**Configuration Rules:**

- ✅ **`||` operator acceptable** in configuration builders for environment variables
- ❌ **NO `||` operator** in business logic for defensive fallbacks
- ✅ **Trust configuration system** - no optional chaining with fallbacks
- ✅ **Defaults in config structure** - not scattered through business logic

### **Configuration Testing Standards**

#### **Config-Agnostic Feature Testing**

**Feature workflows should accept any valid config structure:**

```javascript
// ✅ CORRECT: Feature workflow accepts any valid config
async function exportProducts(params, config, trace = null) {
  // Works with any config structure that has required sections
  const enrichedProducts = await fetchAndEnrichProducts(params, config, trace);
  return { productCount: enrichedProducts.length };
}

// ✅ CORRECT: Easy to test with mock config
const mockConfig = {
  commerce: { baseUrl: 'https://test.com' },
  products: { fields: ['sku', 'name'] },
  storage: { provider: 'mock' }
};

const result = await exportProducts(mockParams, mockConfig);
```

#### **Configuration Mocking Patterns**

```javascript
// ✅ CORRECT: Test configuration mocking
const testConfig = {
  commerce: {
    baseUrl: 'https://test-commerce.com',
    api: { timeout: 5000 },
    batching: { products: 10 }
  },
  products: {
    fields: ['sku', 'name', 'price']
  },
  storage: {
    provider: 'memory',
    directory: '/test'
  }
};

// Test with isolated config - no environment dependencies
const result = await productWorkflow(testParams, testConfig);
```

### **Configuration Validation Integration**

#### **Schema-Driven Configuration Validation**

**Configuration validation as build tooling:**

```javascript
// ✅ CORRECT: Validate during build/deployment
npm run validate    // Concise build integration
npm run test:schemas // Detailed development diagnostics

// ✅ CORRECT: Runtime usage (fast loading)
const config = loadConfig(params); // No validation overhead

// ✅ CORRECT: Development usage (with warnings)
const config = loadValidatedConfig(params); // Warns on issues
```

#### **Feature Configuration Requirements**

**Features should specify their configuration dependencies:**

```javascript
/**
 * Products REST Export Feature
 * 
 * Configuration Requirements:
 * - config.commerce.baseUrl: Commerce API endpoint
 * - config.commerce.api.timeout: Request timeout
 * - config.products.fields: Export field list
 * - config.storage.provider: Storage strategy
 */
async function exportProducts(params, config, trace = null) {
  // Feature uses specified config sections
}
```

### **Action Configuration Integration**

#### **Action Framework Configuration Pattern**

**Actions receive initialized configuration through context:**

```javascript
// ✅ CORRECT: Action uses framework-provided config
async function actionBusinessLogic(context) {
  const { config, extractedParams } = context;
  
  // Pass complete config to feature workflows
  const result = await exportProducts(extractedParams, config);
  
  return { message: 'Export completed', result };
}

module.exports = createAction(actionBusinessLogic, {
  actionName: 'export-products',
  description: 'Export products with configuration'
});

// ❌ WRONG: Action loads configuration manually
async function badActionBusinessLogic(context) {
  const config = loadConfig(context.extractedParams); // Wrong - framework provides config
}
```

### **Configuration Migration Guidelines**

#### **From Direct Environment Access to Configuration System**

```javascript
// ❌ OLD: Direct environment access in business logic
const baseUrl = process.env.COMMERCE_BASE_URL || 'https://default.com';
const timeout = process.env.API_TIMEOUT || 30000;

// ✅ NEW: Configuration system access
const config = loadConfig(params);
const baseUrl = config.commerce.baseUrl;
const timeout = config.commerce.api.timeout;
```

#### **From Defensive Coding to Configuration Trust**

```javascript
// ❌ OLD: Defensive fallbacks everywhere
const pageSize = config.commerce?.product?.pagination?.pageSize || 100;
const retries = config.api?.retries || 3;

// ✅ NEW: Trust configuration system
const { pageSize } = config.commerce.product.pagination;
const retries = config.api.retries;
```

### **Configuration Compliance Checklist**

#### **Feature Implementation Standards**

- [ ] Features receive complete config object as parameter
- [ ] Features extract only needed config sections internally
- [ ] No configuration loading within features
- [ ] No configuration modification within features
- [ ] Operations receive targeted config sections only

#### **Configuration Access Standards**

- [ ] Clean object access (no `?.` with fallbacks)
- [ ] No `||` operator patterns in business logic
- [ ] Defaults in configuration structure only
- [ ] Environment overrides in config builders only
- [ ] Trust configuration system completely

#### **Testing Standards**

- [ ] Features work with mock configuration objects
- [ ] No environment dependencies in feature tests
- [ ] Configuration requirements documented in feature JSDoc
- [ ] Config-agnostic feature implementation

---

## Scripts Architecture Standards

### Feature-First DDD for Scripts

**CRITICAL: Scripts use Feature-First DDD organization for maximum cognitive efficiency:**

Scripts represent complete operational capabilities that users invoke directly, making them perfect candidates for Feature-First organization. Each script file contains everything needed to understand and maintain that specific capability.

#### The Scripts Problem

**Traditional Layer-First Organization:**

- File jumping required to understand complete script workflows
- Context switching between workflows, operations, and utilities
- Feature fragmentation across multiple files
- Cognitive overhead to trace script execution flow

**Feature-First Solution:**

- Complete script capability in single file
- Progressive disclosure: main workflow → operations → utilities
- No file jumping required for script understanding
- Clear script ownership and maintenance boundaries

#### Scripts Feature-First Pattern

**Each script feature file follows this structure:**

```javascript
// scripts/deployment/app-deployment.js

/**
 * Deployment - App Deployment
 * Complete app deployment capability with all supporting functions
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { executeScriptWithExit } = require('../shared/execution/script-framework');
const { parseArgs } = require('../shared/cli/args');

// === DOMAIN DEPENDENCIES ===
const { detectEnvironment } = require('./shared/environment-detection');
const { formatDeploymentOutput } = require('./shared/output-formatting');

// === MAIN SCRIPT WORKFLOW === (What users invoke)
async function deployApp(options = {}) {
  // Step 1: Environment setup
  const environment = detectEnvironment(options);
  await displayDeploymentStart(environment);
  
  // Step 2: Build process  
  const buildResult = await executeBuildProcess(environment);
  if (!buildResult.success) throw new Error(buildResult.error);
  
  // Step 3: Deploy application
  await displayAppDeployment();
  const deployResult = await executeAppDeployment(options);
  
  // Step 4: Display results
  await displayDeploymentResults(deployResult);
  return deployResult;
}

// === SCRIPT OPERATIONS === (Coordinate script steps)
async function executeBuildProcess(environment) {
  // Build coordination logic
}

async function executeAppDeployment(options) {
  // App deployment coordination logic  
}

// === SCRIPT UTILITIES === (Building blocks for this script)
function detectEnvironment(options) {
  // Environment detection logic
}

async function displayDeploymentStart(environment) {
  // Output formatting logic
}

// Entry point for CLI usage
if (require.main === module) {
  executeScriptWithExit('app-deployment', async () => {
    const args = parseArgs(process.argv.slice(2));
    return await deployApp(args);
  });
}

module.exports = { deployApp };
```

#### Scripts vs Application Code Differences

**1. CLI Entry Point Integration:**

```javascript
// Each script includes CLI integration pattern
if (require.main === module) {
  // CLI entry point with argument parsing
}
```

**2. Operational Domain Boundaries:**

- `deployment/` - Everything related to deploying the application
- `testing/` - Everything related to testing the application  
- `monitoring/` - Everything related to monitoring the application
- `development/` - Everything related to development tooling

**3. Enhanced Shared Infrastructure:**
Scripts have more cross-cutting concerns requiring robust shared infrastructure:

- CLI argument parsing (universal need)
- Output formatting (consistent visual experience)
- Script execution framework (error handling, exit codes)
- Environment detection (staging vs production)

### Scripts Development Standards

**CRITICAL: Feature-First with Domain Boundaries**

1. **Complete Features in Single Files** - Each script represents one complete operational capability
2. **Progressive Disclosure** - Main workflow → operations → utilities within each file
3. **Domain Boundaries Respected** - Deployment, testing, monitoring, development domains
4. **Shared Infrastructure Separated** - CLI, execution, and universal utilities in `shared/`
5. **Direct Imports Always** - No namespace imports, explicit dependencies
6. **CLI Integration Pattern** - Consistent entry point pattern across all scripts

### Scripts File Organization Rules

**Required Section Pattern:**

```javascript
// === MAIN SCRIPT WORKFLOW === (What users invoke from CLI)
// === SCRIPT OPERATIONS === (Coordinate multiple script steps)  
// === SCRIPT UTILITIES === (Building blocks for this specific script)
```

**JSDoc Requirements:**

```javascript
/**
 * [Domain] [Script Name]
 * Complete [capability description] with all supporting functions
 * 
 * Used by: npm run [script-name] (CLI integration)
 * @param {Object} options - Script execution options
 * @returns {Promise<Object>} Script execution result
 */
```

**Export Pattern:**

```javascript
module.exports = { 
  mainScriptFunction, // Primary export for programmatic use
  // Secondary functions only if needed by other scripts
};
```

### Migration Benefits

**Cognitive Load Optimization:**

- ✅ **Complete script understanding** in single file
- ✅ **No file jumping** to understand deployment/testing process  
- ✅ **Progressive disclosure** within each script
- ✅ **Predictable script structure** across all operational domains

**Maintained Code Quality:**

- ✅ **DDD domain boundaries** preserved (deployment vs testing vs monitoring)
- ✅ **Shared infrastructure** properly separated
- ✅ **CLI consistency** across all scripts
- ✅ **Clear script ownership** for maintenance

**Developer Experience:**

- ✅ **Easy script debugging** - trace complete logic in one file
- ✅ **Consistent patterns** - same structure for all scripts
- ✅ **Clear modification points** - know exactly where to change functionality

---

## Testing Standards

### Action Testing

```bash
# Test individual actions
npm run test:get-products:target
npm run test:get-products-mesh:target

# Deploy and test
npm run deploy
```

### Framework Integration

- **Always test framework integration** after changes
- **Deploy to verify** - Adobe I/O Runtime behavior differs from local
- **Preserve functionality** - No existing features can break

---

## Development Guidelines

### Creating New Actions

1. **Use direct imports** - Import complete feature functions from domain files
2. **Follow createAction pattern** - Use the established framework
3. **Keep actions thin** - 50-80 lines maximum
4. **No custom error handling** - Let framework handle all errors
5. **Use step-based workflow** - Consistent messaging patterns
6. **Import complete capabilities** - Use main workflow functions from feature files

### Creating New Domain Functions

1. **Follow Feature-First organization** - Complete capabilities in single files
2. **Use direct imports** - Import specific dependencies  
3. **Single responsibility** - Each function does one thing well
4. **Pure functions** - Clear input/output contracts
5. **Domain-specific** - Business logic stays in appropriate domain
6. **Progressive disclosure** - Workflows → operations → utilities within each file

---

## Advanced Patterns

### API Mesh Integration

**CRITICAL: JavaScript Compatibility**

API Mesh JavaScript parser has compatibility limitations:

```javascript
// ✅ CORRECT: String concatenation for API Mesh resolvers
const inventoryUrl = 'https://example.com/rest/V1/stockItems/' + sku;
const message = 'Successfully fetched ' + count + ' products';

// ❌ WRONG: Template literals not fully supported in API Mesh
const inventoryUrl = `https://example.com/rest/V1/stockItems/${sku}`;
```

### Commerce Integration

**CRITICAL: Admin Token Authentication**

All Commerce API calls use admin token authentication as the standard practice:

```javascript
// ✅ CORRECT: Use executeAdminTokenCommerceRequest for admin token authentication
const { executeAdminTokenCommerceRequest } = require('../../../src/commerce/operations/api-requests');

const response = await executeAdminTokenCommerceRequest('/products', {
  method: 'GET',
}, config); // config contains admin token
```

**Required Admin Token Configuration:**
All actions calling Commerce APIs must have these inputs:

- `COMMERCE_BASE_URL` - Commerce instance URL
- `COMMERCE_ADMIN_USERNAME` - Admin user username  
- `COMMERCE_ADMIN_PASSWORD` - Admin user password

**Authentication Flow:**

1. Admin token is obtained using username/password
2. Token is cached and reused for subsequent requests
3. Token is automatically refreshed when expired

---

## Compliance Checklist

### Action Standards

- [ ] Uses `createAction()` framework
- [ ] Clean orchestrator pattern (50-80 lines)
- [ ] Direct imports for dependencies
- [ ] Step-based workflow with `formatStepMessage()`
- [ ] No custom error handling
- [ ] Consistent response structure

### Configuration Standards

- [ ] Clean object access (no `?.` with fallbacks)
- [ ] No `||` operator patterns in business logic
- [ ] Defaults in configuration structure only
- [ ] Environment overrides in config builders only
- [ ] Features receive complete config object as parameter
- [ ] Features extract only needed config sections internally
- [ ] No configuration loading within features
- [ ] No configuration modification within features
- [ ] Operations receive targeted config sections only
- [ ] Config-agnostic feature implementation for testing
- [ ] Configuration requirements documented in feature JSDoc

### Scripts Standards

- [ ] Feature-First DDD organization (complete capabilities in single files)
- [ ] Operational domain boundaries (deployment, testing, monitoring, development)
- [ ] Progressive disclosure (main workflow → operations → utilities)
- [ ] Direct imports (no namespace imports)
- [ ] CLI integration pattern (consistent entry points)
- [ ] Shared infrastructure in `scripts/shared/`

### Function Standards

- [ ] Single responsibility (10-40 lines)
- [ ] Clear parameter contracts
- [ ] Pure functions with clear input/output
- [ ] Domain-appropriate organization

---

## Migration from Legacy Patterns

### If You See References To

1. **Domain catalogs** (`src/products/index.js`) - These don't exist, use direct imports
2. **Domain injection** (`const { products } = context`) - Not implemented, use direct imports
3. **Action lib/ directories** - Deprecated, use domain workflows instead
4. **Layer-first scripts** (`scripts/deploy/workflows/`, `scripts/test/operations/`) - Deprecated, use Feature-First organization
5. **Scripts/core directory** (`scripts/core/`) - Moved to `scripts/shared/`
6. **Namespace imports** in scripts - Use direct imports instead

### Current Reality

- ✅ **Direct imports throughout** - Working and implemented
- ✅ **Action framework** - createAction() implemented and working
- ✅ **Feature-First DDD scripts** - Complete capabilities in single files for cognitive efficiency
- ✅ **Operational domain boundaries** - Deployment, testing, monitoring, development domains
- ✅ **Strategic duplication** - Better than complex abstractions

---

## Success Metrics Achieved

### Code Quality

- **Zero duplication** across actions (216 lines eliminated)
- **Consistent patterns** (100% compliance)
- **Average action size**: 46 lines (down from 123 lines)
- **Boilerplate eliminated**: 15-25 lines per action

### Developer Experience

- **Predictable structure** in every action
- **Self-documenting** business logic flows
- **Easy maintenance** through consistent patterns
- **Fast development** with framework templates

### Architecture Quality

- **Direct import clarity** - Dependencies are immediately obvious
- **Action framework consistency** - All actions follow the same pattern
- **Feature-First DDD organization** - Complete capabilities with domain boundaries
- **Strategic duplication** - Better maintainability than complex abstractions
- **Configuration integration** - Clean dependency injection through Feature-first architecture
- **Domain configuration composition** - Each domain manages its own configuration concerns
- **Config-agnostic features** - Features work with any valid configuration structure

---

## Conclusion

This architecture successfully implements:

- ✅ **Direct import clarity** - Dependencies are immediately obvious
- ✅ **Action framework consistency** - All actions follow the same pattern
- ✅ **Feature-First DDD organization** - Complete capabilities with domain boundaries
- ✅ **Strategic duplication** - Better maintainability than complex abstractions
- ✅ **Configuration trust** - Clean access patterns without defensive fallbacks
- ✅ **Error handling delegation** - Framework handles all infrastructure concerns

The foundation supports rapid, consistent development while maintaining high code quality and clear architectural boundaries. All principles have been validated through successful implementation across 5 actions and the Feature-First DDD scripts architecture.

### Unified Architecture Benefits

**Feature-First DDD Application + Scripts provides:**

✅ **Cognitive Consistency** - Same mental model for both application code and operational scripts  
✅ **Complete Feature Understanding** - No file jumping required for any capability  
✅ **Domain Boundary Preservation** - DDD principles maintained across all code contexts  
✅ **Progressive Disclosure** - Composite → atomic organization in both applications and scripts  
✅ **Operational Efficiency** - Scripts represent complete user capabilities, perfectly aligned with Feature-First approach

## Response Building Standards

**CRITICAL: Unified Response Building Patterns**

All backend operations must use standardized response building patterns to eliminate duplication and ensure consistency across the entire application.

### **Core Response Foundation**

**ALWAYS use the core response utilities as the foundation:**

```javascript
const { response } = require('../../shared/http/responses');

// ✅ CORRECT: Use core response patterns
return response.success(data, message, metadata);
return response.error(error, context);
return response.badRequest(message, context);
return response.exportSuccess(data, message, metadata);
return response.jsonData(data, message, metadata);
```

**Core Response Rules:**

- **Foundation First**: Core `response` utilities are the single source of truth
- **No Direct Construction**: Never manually construct `{ statusCode, headers, body }` responses
- **Domain Wrappers Only**: Domain-specific builders should be thin wrappers around core functions
- **Consistent Metadata**: Use `options.steps` for step information, not scattered patterns

### **Domain Response Patterns**

**Create domain-specific response builders as thin wrappers:**

```javascript
// ✅ CORRECT: Domain wrapper pattern
function buildSuccessResponse(data, message = 'Operation completed successfully', metadata = {}) {
  return response.success(data, message, metadata);
}

function buildErrorResponse(error, context = {}) {
  return response.error(error, context);
}

// ❌ WRONG: Recreating core functionality
function buildSuccessResponse(data, message) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, message, ...data })
  };
}
```

### **Storage Response Consolidation**

**CRITICAL: Single Storage Response Builder**

Use only one storage response builder across the entire application:

```javascript
// ✅ CORRECT: Use consolidated storage response builder
const { buildStorageResponse } = require('../operations/response-building');

// Standard signature for all storage operations
const storageResponse = buildStorageResponse(storageResult, storage, config);

// ❌ WRONG: Multiple competing storage response builders
// Don't use: presigned-url-manager.js buildStorageResponse
// Don't use: response-factories.js createAppBuilderPresignedUrlResponse
// Don't use: Manual response construction
```

**Storage Response Rules:**

- **Single Source**: Only `src/files/operations/response-building.js` exports storage response builders
- **Standard Signature**: `buildStorageResponse(storageResult, storage, config)` - never change this
- **Deprecate Duplicates**: Remove competing builders in utils directories
- **Workflow Integration**: All storage workflows must use the operations layer builder

### **Response Building Layer Architecture**

**CRITICAL: Response building uses layer-first organization (infrastructure concern) while business logic uses Feature-First organization (business concern).**

**Why Layer-First for Responses:**

- **Infrastructure Concern**: Response building is technical formatting, not business logic
- **Cross-Feature Consistency**: All features need identical response structure
- **Single Source of Truth**: HTTP response contracts must be universal
- **Separation of Concerns**: Response formatting ≠ business capability

**Follow strict layering for response building:**

```text
┌─────────────────────────────────────────┐
│ Actions Layer                           │
│ - Uses workflow response builders       │
│ - Never constructs responses directly   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Workflows Layer                         │
│ - Uses operations response builders     │
│ - Orchestrates multiple operations      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Operations Layer                        │
│ - Domain-specific response builders     │
│ - Thin wrappers around core functions   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Core Layer                              │
│ - response.success/error/badRequest     │
│ - Single source of truth                │
└─────────────────────────────────────────┘
```

**Integration with Feature-First Organization:**

```javascript
/**
 * Files CSV Export
 * Feature-First file demonstrating integration with layer-first response building
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { response } = require('../../shared/http/responses'); // Core layer

// === DOMAIN DEPENDENCIES ===
const { buildStorageResponse } = require('./shared/response-building'); // Operations layer

// === BUSINESS WORKFLOWS ===
async function exportProductsAsCsv(products, config) {
  try {
    // Business logic in Feature-First organization
    const csvData = transformProductsToCsv(products, config);
    const storageResult = await storeCsvData(csvData, config);
    
    // Response building through layer-first infrastructure
    return buildStorageResponse(storageResult, storage, config); // Uses Core layer
    
  } catch (error) {
    // Error handling returns response through infrastructure
    return response.error(error, { feature: 'csv-export' });
  }
}
```

**Key Integration Principle:** Business logic (Feature-First) orchestrates capabilities, response building (Layer-First) formats output consistently.

### **Elimination of Response Building Duplication**

**Remove these patterns immediately:**

```javascript
// ❌ WRONG: Multiple response builders with same purpose
buildStorageResponse()        // operations/response-building.js
buildStorageResponse()        // utils/presigned-url-manager.js (REMOVE)
createAppBuilderPresignedUrlResponse()  // utils/response-factories.js (REMOVE)
createS3PresignedUrlResponse()         // utils/response-factories.js (REMOVE)

// ❌ WRONG: Manual response construction in utilities
return {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
};

// ❌ WRONG: Domain-specific response construction
function buildCustomResponse(data) {
  return {
    success: true,
    customField: data,
    // ... manual construction
  };
}
```

### **Response Building Testing Standards**

**Test response builders through the operations layer:**

```javascript
// ✅ CORRECT: Test operations layer response builders
const { buildStorageResponse } = require('../src/files/operations/response-building');
const testResponse = buildStorageResponse(mockStorageResult, mockStorage, mockConfig);

// ❌ WRONG: Test utility layer response builders
// const { buildStorageResponse } = require('../src/files/utils/presigned-url-manager');
```

### **Documentation Requirements**

**Document response building patterns:**

- **Function Purpose**: What type of response does each builder create
- **Standard Signature**: Exact parameters and their types  
- **Usage Context**: When to use each builder (actions vs workflows vs operations)
- **Migration Notes**: How to update from deprecated patterns
