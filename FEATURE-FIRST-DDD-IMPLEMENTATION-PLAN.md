# Feature-First DDD Architecture Implementation Plan

## Executive Summary

**Project Scope:** Complete architectural transformation of Adobe App Builder Commerce integration application from layer-first to Feature-First DDD architecture as defined in ARCHITECTURE-STANDARDS.md (2,514 lines).

**Current State:** 501 Tier 1 audit failures, 211 Tier 2 warnings across 8 interconnected architectural systems requiring systematic transformation.

**Target Architecture:** Feature-First DDD with 3-tiered shared functions, unified action framework, clean configuration patterns, and comprehensive error handling.

---

## Current State Analysis

### Audit Baseline (501 Tier 1 Failures)

**Critical Issues by Category (AUDIT-ALIGNED):**

- **export-patterns**: 110 files missing organization comments (HIGHEST PRIORITY)
- **jsdoc-documentation**: 170 files missing @purpose/@usedBy tags  
- **import-organization**: 45 files missing three-tier organization
- **action-framework-compliance**: 5 actions need createAction() migration
- **step-comments**: 6 files missing workflow step comments
- **file-headers**: 12 files missing descriptive headers
- **naming-conventions**: 8 files with naming violations
- **file-structure**: 3 files with structural issues

**PRIORITY CORRECTION**: Export patterns are the #1 violation (110 files) and should be addressed immediately, not in Week 11.

---

## Implementation Strategy

### Core Principles

1. **Audit-Driven Priorities** - Address highest violation counts first
2. **Quick Wins First** - Simple, high-impact changes early
3. **Incremental Validation** - Audit compliance verification at each milestone
4. **Maintain Functionality** - No breaking changes to existing capabilities
5. **Clear Success Criteria** - Measurable progress tracking

### Phase Dependencies (CORRECTED - ARCHITECTURE FIRST)

```text
Phase 1 (Foundation) → Phase 2 (Feature-First File Organization) → Phase 3 (Function Organization)
     ↓                        ↓                                      ↓
Phase 4 (Action Framework) → Phase 5 (Domain Boundaries) → Phase 6 (Surface-Level Compliance)
     ↓                          ↓                              ↓
Phase 7 (Export Patterns) → Phase 8 (JSDoc Documentation) → Phase 9 (Minor Fixes)
     ↓                         ↓                               ↓
Phase 10 (Final Validation) ← Phase 9 (Step Comments/Headers/Naming)
```

---

## Phase 1: Shared Infrastructure Foundation (Week 1)

### Objective

Create Tier 1 shared infrastructure (`src/shared/`) to support Feature-First DDD architecture.

### Tasks

#### 1.1 Create Shared Infrastructure Directory Structure

```bash
src/shared/
├── action/
│   └── operations/
│       └── action-factory.js
├── errors/
│   ├── types.js
│   ├── factory.js
│   ├── handling.js
│   ├── recovery.js
│   ├── responses.js
│   └── operations/
│       ├── classification.js
│       ├── enhancement.js
│       └── transformation.js
├── http/
│   ├── client.js
│   └── responses.js
├── routing/
│   └── operations/
│       ├── runtime.js
│       └── commerce.js
├── validation/
│   └── operations/
│       ├── parameters.js
│       └── product.js
└── utils/
    └── operations/
        ├── formatting.js
        └── async.js
```

#### 1.2 Migrate Core Utilities to Shared

**Source → Target Migration:**

- `src/core/action/` → `src/shared/action/`
- `src/core/errors/` → `src/shared/errors/`
- `src/core/http/` → `src/shared/http/`
- `src/core/routing/` → `src/shared/routing/`
- `src/core/validation/` → `src/shared/validation/`
- `src/core/utils/` → `src/shared/utils/`

#### 1.3 Update All Import References

**Pattern Replacement Across Codebase:**

```javascript
// Before
const { createAction } = require('../../src/core/action/operations/action-factory');

// After  
const { createAction } = require('../../src/shared/action/operations/action-factory');
```

### Success Criteria

- [ ] **Directory Structure Created** - All shared directories exist with proper organization
- [ ] **Core Migration Complete** - All utilities moved from `core/` to `shared/`
- [ ] **Import References Updated** - No remaining `src/core/` imports in codebase
- [ ] **Functionality Preserved** - All existing actions continue to work
- [ ] **Audit Improvement** - file-structure-compliance improves by 3+ files

### Validation Commands

```bash
# Test functionality preservation
npm run test:action get-products
npm run test:action get-products-mesh

# Audit progress
npm run audit | grep "file-structure-compliance"

# Import verification
grep -r "src/core/" src/ actions/ scripts/
```

---

## Phase 2: Feature-First File Organization (Week 2)

### Objective

**Build new feature-first files alongside existing layer-first structure, then switch atomically** to avoid broken intermediate states during the transition to Feature-First DDD architecture.

### Strategy: Parallel Development + Atomic Switch

**STEP 1: Build New Feature Files (Parallel)**

Build complete feature files alongside existing structure without breaking anything:

```bash
src/products/
├── workflows/             # KEEP EXISTING (working)
├── operations/            # KEEP EXISTING (working)
├── utils/                 # KEEP EXISTING (working)
├── rest-export.js         # NEW - complete REST API export feature
├── mesh-export.js         # NEW - complete API Mesh export feature
├── product-enrichment.js  # NEW - complete product enrichment feature
└── shared/                # NEW - only truly shared utilities
    └── (extracted as needed)
```

**STEP 2: Validate New Files in Isolation**

Test new consolidated files independently before switching:

```bash
# Syntax validation
node -e "require('./src/products/rest-export.js')"
node -e "require('./src/products/mesh-export.js')"

# Linting validation
npm run lint src/products/rest-export.js
npm run lint src/products/mesh-export.js
```

**STEP 3: Atomic Switch**

Update ALL imports simultaneously, deploy, test complete system:

```bash
# Before (using layer-first)
actions/get-products/index.js: require('../../src/products/workflows/rest-export')

# After (using feature-first) - ALL imports changed in one commit
actions/get-products/index.js: require('../../src/products/rest-export')
```

**STEP 4: Test Complete New System**

```bash
npm run deploy
npm run test:action get-products    # Test complete feature-first system
npm run test:action get-products-mesh
```

**STEP 5: Remove Old Structure**

Only after confirming new system works completely:

```bash
rm -rf src/products/workflows/
rm -rf src/products/operations/
rm -rf src/products/utils/
```

### Tasks

#### 2.1 Products Domain - Parallel Build

**Build new files alongside existing:**

- `src/products/rest-export.js` - Consolidate workflows/rest-export + operations/enrichment + operations/transformation + utils/csv
- `src/products/mesh-export.js` - Consolidate workflows/mesh-export + operations/mesh-integration + utils/data
- `src/products/product-enrichment.js` - Consolidate enrichment operations into reusable feature

#### 2.2 Files Domain - Parallel Build

**Build new files alongside existing:**

- `src/files/csv-export.js` - Feature CORE (workflows + operations)
- `src/files/csv-export/` - Feature SUB-MODULES (when >400 lines): storage-strategies.js, url-generation.js, metadata.js, validation.js
- `src/files/file-browser.js` - Feature CORE (workflows + operations)  
- `src/files/file-browser/` - Feature SUB-MODULES (when >400 lines): ui-generation.js, navigation.js, filtering.js, validation.js
- `src/files/file-download.js` - Feature CORE (workflows + operations)
- `src/files/file-download/` - Feature SUB-MODULES (when >400 lines): url-generation.js, access-control.js, validation.js
- `src/files/file-deletion.js` - Feature CORE (workflows + operations)
- `src/files/file-deletion/` - Feature SUB-MODULES (when >400 lines): confirmation.js, cleanup.js, validation.js

#### 2.3 Commerce Domain - Parallel Build

**Build new files alongside existing:**

- `src/commerce/product-fetching.js` - Feature CORE (workflows + operations)
- `src/commerce/product-fetching/` - Feature SUB-MODULES (when >400 lines): api-requests.js, pagination.js, filtering.js, validation.js
- `src/commerce/category-enrichment.js` - Feature CORE (workflows + operations)
- `src/commerce/category-enrichment/` - Feature SUB-MODULES (when >400 lines): category-mapping.js, hierarchy-building.js, data-enrichment.js, validation.js
- `src/commerce/inventory-enrichment.js` - Feature CORE (workflows + operations)
- `src/commerce/inventory-enrichment/` - Feature SUB-MODULES (when >400 lines): stock-fetching.js, availability-calc.js, batch-processing.js, validation.js
- `src/commerce/admin-token-auth.js` - Feature CORE (workflows + operations)
- `src/commerce/admin-token-auth/` - Feature SUB-MODULES (when >400 lines): token-management.js, credential-validation.js, session-handling.js, validation.js

#### 2.4 HTMX Domain - Parallel Build

**Build new files alongside existing:**

- `src/htmx/file-browser-ui.js` - Feature CORE (workflows + operations)
- `src/htmx/file-browser-ui/` - Feature SUB-MODULES (when >400 lines): html-generation.js, table-generation.js, modal-generation.js, validation.js
- `src/htmx/modal-interactions.js` - Feature CORE (workflows + operations)
- `src/htmx/modal-interactions/` - Feature SUB-MODULES (when >400 lines): confirmation-modals.js, form-modals.js, response-handling.js, validation.js
- `src/htmx/notification-system.js` - Feature CORE (workflows + operations)
- `src/htmx/notification-system/` - Feature SUB-MODULES (when >400 lines): toast-generation.js, alert-generation.js, progress-indicators.js, validation.js

#### 2.5 Feature File Template

**Each new feature file follows this structure:**

```javascript
/**
 * [Domain] [Feature Name]
 * Complete [feature description] capability with all supporting functions
 */

// All dependencies at top - external vs internal obvious from paths
const { formatStepMessage } = require('../../shared/utils/operations/formatting');
const { response } = require('../../shared/http/responses');
const { createDomainError } = require('./shared/errors');
const { crossDomainFeature } = require('../other-domain/feature-name');

// === BUSINESS WORKFLOWS ===
async function mainBusinessWorkflow(params, config) {
  // Step 1: High-level business step
  // Step 2: Next business step  
  // Step 3: Final business step
}

// === FEATURE OPERATIONS ===
async function coordinatingOperation(params, config) {
  // Mid-level coordination logic
}

// === FEATURE UTILITIES ===
function featureSpecificUtility(data) {
  // Simple, focused implementation
}

module.exports = {
  // Business workflows (main exports)
  mainBusinessWorkflow,
  
  // Feature operations (available if needed)
  coordinatingOperation,
  
  // Feature utilities (internal, but exportable)
  featureSpecificUtility,
};
```

### Success Criteria

- [ ] **Parallel Files Built** - All new feature files created alongside existing
- [ ] **Isolated Validation** - New files pass syntax and linting checks
- [ ] **Atomic Import Switch** - All imports updated simultaneously
- [ ] **Complete System Test** - All actions work with new feature-first architecture
- [ ] **Old Structure Removed** - Layer-first directories deleted after validation
- [ ] **Zero Downtime** - No broken intermediate states during transition
- [ ] **Audit Success** - feature-first-file-organization shows significant improvement

### Validation Commands

```bash
# STEP 1: Validate parallel development
find src/ -name "*.js" | grep -E "(rest-export|mesh-export|file-browser)" # New files exist
find src/ -name "workflows" -o -name "operations" -o -name "utils" -type d # Old structure still exists

# STEP 2: Test complete new system
npm run deploy
npm run test:action get-products
npm run test:action get-products-mesh
npm run test:action browse-files

# STEP 3: Verify old structure removal
find src/ -name "workflows" -o -name "operations" -o -name "utils" -type d # Should be empty

# STEP 4: Audit architectural progress
npm run audit | grep "feature-first-file-organization"
```

---

## Phase 3: Function Organization (Week 3)

### Objective

**Restructure functions within each file to match the file's purpose** according to Feature-First DDD principles and progressive disclosure patterns.

### Tasks

#### 3.1 Implement Progressive Disclosure Organization

**Add section organization to all feature files with 3+ functions:**

```javascript
/**
 * Products REST Export
 * Complete product export capability with all supporting functions
 */

// All dependencies at top - external vs internal obvious from paths
const { formatStepMessage } = require('../../shared/utils/operations/formatting');

// Business Workflows (What actions use)
async function exportProducts(params, config) {
  // Step 1: Validate export parameters
  // Step 2: Fetch and enrich products  
  // Step 3: Transform for export
  // Step 4: Generate CSV
  // Step 5: Store file
}

// Feature Operations (Coordination logic)
async function fetchAndEnrichProducts(params, config) { }
async function transformProductData(products, config) { }
async function generateProductCsv(products, config) { }

// Feature Utilities (Building blocks)
function validateProductFields(fields) { }
function formatProductPrice(price, currency) { }
function buildProductImageUrl(product, config) { }

module.exports = {
  // Business workflows (6+ exports need comments)
  exportProducts,
  
  // Feature operations  
  fetchAndEnrichProducts,
  transformProductData,
  
  // Feature utilities
  validateProductFields,
  formatProductPrice
};
```

#### 3.2 Align Functions with File Purpose

**Ensure functions within each file match the file's stated purpose:**

- **Export files** (`*-export.js`) - Should contain export workflow, transformation, and CSV generation
- **Authentication files** (`*-auth.js`) - Should contain token management, validation, and auth workflows
- **Browser files** (`*-browser.js`) - Should contain UI generation, navigation, and display logic
- **Integration files** (`*-integration.js`) - Should contain API calls, data consolidation, and response processing

#### 3.3 Remove Function-Purpose Mismatches

**Move functions to appropriate files or consolidate related functions:**

```javascript
// ❌ WRONG: Authentication logic in export file
src/products/rest-export.js:
- exportProducts()           ✅ Correct
- generateCsv()             ✅ Correct  
- authenticateUser()        ❌ Move to admin-token-auth.js

// ✅ CORRECT: Functions match file purpose
src/products/rest-export.js:
- exportProducts()           ✅ Main workflow
- fetchAndEnrichProducts()   ✅ Feature operation
- transformProductData()     ✅ Feature operation
- validateExportFields()     ✅ Feature utility
```

#### 3.4 Implement Step Comments for Workflows

**Add clear step comments to all workflow functions:**

```javascript
// ✅ CORRECT: Clear step comments for workflow logic
async function exportProducts(params, config) {
  // Step 1: Validate export parameters and user permissions
  const validatedParams = await validateExportRequest(params, config);
  
  // Step 2: Fetch and enrich products from Commerce API
  const enrichedProducts = await fetchAndEnrichProducts(validatedParams, config);
  
  // Step 3: Transform products for export format
  const transformedData = await transformProductData(enrichedProducts, config);
  
  // Step 4: Generate CSV content with proper headers
  const csvContent = await generateProductCsv(transformedData, config);
  
  // Step 5: Store file and return download information
  const storageResult = await storeCsvFile(csvContent, config);
  
  return {
    downloadUrl: storageResult.downloadUrl,
    productCount: enrichedProducts.length,
    fileSize: csvContent.length
  };
}
```

#### 3.5 Establish Clear Function Contracts

**Add comprehensive JSDoc to workflow and operation functions:**

```javascript
/**
 * Products REST Export Feature
 * @purpose Execute complete product export workflow with REST API integration
 * @param {Object} params - Export parameters (filters, pagination, etc.)
 * @param {Object} config - Complete application configuration
 * @returns {Promise<Object>} Export result with CSV data and metadata
 * @throws {Error} When Commerce API is unavailable or data is invalid
 * @config commerce.baseUrl, commerce.api.timeout, products.fields, storage.provider
 */
async function exportProducts(params, config) {
  // Implementation
}
```

### Success Criteria

- [ ] **Progressive Disclosure** - All feature files use BUSINESS WORKFLOWS → FEATURE OPERATIONS → FEATURE UTILITIES
- [ ] **Function-Purpose Alignment** - Functions within files match the file's stated purpose
- [ ] **Step Comments Added** - All workflow functions have clear "Step N:" comments
- [ ] **Clear Contracts** - Workflow functions have comprehensive JSDoc
- [ ] **No Function Mismatches** - No authentication in export files, no UI in business logic, etc.
- [ ] **Audit Success** - function-organization-within-files shows significant improvement

### Validation Commands

```bash
# Audit function organization progress
npm run audit | grep "function-organization-within-files"

# Verify progressive disclosure sections
grep -r "=== BUSINESS WORKFLOWS ===" src/
grep -r "=== FEATURE OPERATIONS ===" src/
grep -r "=== FEATURE UTILITIES ===" src/

# Check step comments in workflows
grep -r "// Step [0-9]:" src/

# Verify function-purpose alignment
npm run audit | grep "step-comments"
npm run test:action get-products
npm run test:action get-products-mesh
```

---

## Phase 4: Action Framework Compliance (Week 4)

### Objective

**FIX 5 ACTION FILES** to use createAction() framework **AND** comply with comprehensive action architecture standards.

### Tasks

#### 4.1 Migrate All Action Files to createAction()

**Transform EXACT action files identified by audit to meet ALL new action standards:**

```javascript
// actions/get-products/index.js

/**
 * Product Export Action
 * Business capability: Export product data as CSV with multiple implementation options
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../src/shared/action/operations/action-factory');

// === DOMAIN DEPENDENCIES === 
const { exportProducts } = require('../../src/products/rest-export');

// === ACTION BUSINESS LOGIC ===
async function productExportBusinessLogic(context) {
  const { config, extractedParams, core } = context;
  
  // Step 1: Execute domain workflow
  const exportResult = await exportProducts(extractedParams, config);
  
  return {
    message: 'Product export completed successfully',
    steps: [
      core.formatStepMessage('product-export', 'success', 'CSV generated and stored')
    ],
    downloadUrl: exportResult.downloadUrl,
    storage: exportResult.storage,
    productCount: exportResult.productCount
  };
}

// === ACTION FRAMEWORK INTEGRATION ===
module.exports = createAction(productExportBusinessLogic, {
  actionName: 'get-products',
  description: 'Export product data as CSV using REST API'
});
```

#### 4.2 Implement Domain Integration Patterns

**Ensure proper action-to-domain mapping for all 5 actions:**

- `get-products/` → `require('../../src/products/rest-export')`
- `get-products-mesh/` → `require('../../src/products/mesh-export')`
- `browse-files/` → `require('../../src/files/file-browser')`
- `download-file/` → `require('../../src/files/file-download')`
- `delete-file/` → `require('../../src/files/file-deletion')`

#### 4.3 Add Action-Specific JSDoc Documentation

**Each action needs JSDoc with business capability focus:**

```javascript
/**
 * [Business Capability] Action
 * Business capability: [Clear description of what business use case this serves]
 * 
 * @purpose [Action purpose in business terms]
 * @param {Object} context - Action context from createAction framework
 * @returns {Promise<Object>} Business result with success message, steps, and domain data
 * @usedBy Adobe App Builder frontend, external API consumers
 */
async function actionBusinessLogic(context) {
  // Implementation
}
```

#### 4.4 Apply Import Organization to Actions

**All actions must follow three-tier import pattern:**

```javascript
// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../src/shared/action/operations/action-factory');

// === DOMAIN DEPENDENCIES ===
const { domainWorkflow } = require('../../src/domain/feature-file');

// === CROSS-DOMAIN DEPENDENCIES ===
// (if needed for specific actions)
```

#### 4.5 Validate Business Capability Naming

**Ensure action directory names reflect user intent:**

- ✅ `get-products` - Clear business intent
- ✅ `browse-files` - User-focused action  
- ✅ `download-file` - Specific business operation
- ✅ `delete-file` - Clear business capability
- ✅ `get-products-mesh` - Implementation variant (acceptable)

#### 4.6 Remove Legacy Action Patterns

**Eliminate custom patterns from identified action files:**

- Remove `async function main()` patterns
- Remove `module.exports = { main }` exports
- Remove manual parameter extraction
- Remove custom error handling try/catch blocks
- Remove business logic embedded in actions

### Success Criteria

- [ ] **All 5 Actions Migrated** - Every action uses createAction() framework
- [ ] **Domain Integration** - All actions import from correct src/ domain workflows
- [ ] **Business Capability Names** - Action names reflect user intent, not technical implementation
- [ ] **Import Organization** - All actions follow three-tier import pattern
- [ ] **Action JSDoc** - All actions have business capability documentation
- [ ] **Thin Orchestration** - Actions delegate to domain workflows (no business logic)
- [ ] **Framework Integration** - Consistent action template across all actions
- [ ] **Action-Domain Mapping** - Verified correct domain workflow imports
- [ ] **Step Comments** - Action business logic has clear step comments
- [ ] **Audit Success** - action-framework-compliance shows 0 failures (from 5)

### Validation Commands

```bash
# Audit action framework (main metric - now includes ALL action standards)
npm run audit | grep "action-framework-compliance"

# Test each action after transformation
npm run test:action get-products
npm run test:action get-products-mesh
npm run test:action browse-files
npm run test:action download-file
npm run test:action delete-file

# Verify no legacy patterns
grep -r "async function main" actions/
grep -r "module.exports.*main" actions/

# Verify domain integration patterns
grep -r "require.*src/" actions/

# Verify import organization
grep -r "=== INFRASTRUCTURE DEPENDENCIES ===" actions/
grep -r "=== DOMAIN DEPENDENCIES ===" actions/

# Verify business capability JSDoc
grep -r "Business capability:" actions/
```

---

## Phase 5: Domain Boundaries (Week 5)

### Objective

**Build new feature-first files alongside existing layer-first structure, then switch atomically** to avoid broken intermediate states.

### Strategy: Parallel Development + Atomic Switch

**STEP 1: Build New Feature Files (Parallel)**

Build complete feature files alongside existing structure without breaking anything:

```bash
src/products/
├── workflows/             # KEEP EXISTING (working)
├── operations/            # KEEP EXISTING (working)
├── utils/                 # KEEP EXISTING (working)
├── rest-export.js         # NEW - complete REST API export feature
├── mesh-export.js         # NEW - complete API Mesh export feature
├── product-enrichment.js  # NEW - complete product enrichment feature
└── shared/                # NEW - only truly shared utilities
    └── (extracted as needed)
```

**STEP 2: Validate New Files in Isolation**

Test new consolidated files independently before switching:

```bash
# Syntax validation
node -e "require('./src/products/rest-export.js')"
node -e "require('./src/products/mesh-export.js')"

# Linting validation
npm run lint src/products/rest-export.js
npm run lint src/products/mesh-export.js
```

**STEP 3: Atomic Switch**

Update ALL imports simultaneously, deploy, test complete system:

```bash
# Before (using layer-first)
actions/get-products/index.js: require('../../src/products/workflows/rest-export')

# After (using feature-first) - ALL imports changed in one commit
actions/get-products/index.js: require('../../src/products/rest-export')
```

**STEP 4: Test Complete New System**

```bash
npm run deploy
npm run test:action get-products    # Test complete feature-first system
npm run test:action get-products-mesh
```

**STEP 5: Remove Old Structure**

Only after confirming new system works completely:

```bash
rm -rf src/products/workflows/
rm -rf src/products/operations/
rm -rf src/products/utils/
```

### Tasks

#### 5.1 Products Domain - Parallel Build

**Build new files alongside existing:**

- `src/products/rest-export.js` - Consolidate workflows/rest-export + operations/enrichment + operations/transformation + utils/csv
- `src/products/mesh-export.js` - Consolidate workflows/mesh-export + operations/mesh-integration + utils/data
- `src/products/product-enrichment.js` - Consolidate enrichment operations into reusable feature

#### 5.2 Files Domain - Parallel Build

**Build new files alongside existing:**

- `src/files/csv-export.js` - Feature CORE (workflows + operations)
- `src/files/csv-export/` - Feature SUB-MODULES (when >400 lines): storage-strategies.js, url-generation.js, metadata.js, validation.js
- `src/files/file-browser.js` - Feature CORE (workflows + operations)  
- `src/files/file-browser/` - Feature SUB-MODULES (when >400 lines): ui-generation.js, navigation.js, filtering.js, validation.js
- `src/files/file-download.js` - Feature CORE (workflows + operations)
- `src/files/file-download/` - Feature SUB-MODULES (when >400 lines): url-generation.js, access-control.js, validation.js
- `src/files/file-deletion.js` - Feature CORE (workflows + operations)
- `src/files/file-deletion/` - Feature SUB-MODULES (when >400 lines): confirmation.js, cleanup.js, validation.js

#### 5.3 Commerce Domain - Parallel Build

**Build new files alongside existing:**

- `src/commerce/product-fetching.js` - Feature CORE (workflows + operations)
- `src/commerce/product-fetching/` - Feature SUB-MODULES (when >400 lines): api-requests.js, pagination.js, filtering.js, validation.js
- `src/commerce/category-enrichment.js` - Feature CORE (workflows + operations)
- `src/commerce/category-enrichment/` - Feature SUB-MODULES (when >400 lines): category-mapping.js, hierarchy-building.js, data-enrichment.js, validation.js
- `src/commerce/inventory-enrichment.js` - Feature CORE (workflows + operations)
- `src/commerce/inventory-enrichment/` - Feature SUB-MODULES (when >400 lines): stock-fetching.js, availability-calc.js, batch-processing.js, validation.js
- `src/commerce/admin-token-auth.js` - Feature CORE (workflows + operations)
- `src/commerce/admin-token-auth/` - Feature SUB-MODULES (when >400 lines): token-management.js, credential-validation.js, session-handling.js, validation.js

#### 5.4 HTMX Domain - Parallel Build

**Build new files alongside existing:**

- `src/htmx/file-browser-ui.js` - Feature CORE (workflows + operations)
- `src/htmx/file-browser-ui/` - Feature SUB-MODULES (when >400 lines): html-generation.js, table-generation.js, modal-generation.js, validation.js
- `src/htmx/modal-interactions.js` - Feature CORE (workflows + operations)
- `src/htmx/modal-interactions/` - Feature SUB-MODULES (when >400 lines): confirmation-modals.js, form-modals.js, response-handling.js, validation.js
- `src/htmx/notification-system.js` - Feature CORE (workflows + operations)
- `src/htmx/notification-system/` - Feature SUB-MODULES (when >400 lines): toast-generation.js, alert-generation.js, progress-indicators.js, validation.js

#### 5.5 Feature File Template

**Each new feature file follows this structure:**

```javascript
/**
 * [Domain] [Feature Name]
 * Complete [feature description] capability with all supporting functions
 */

// All dependencies at top - external vs internal obvious from paths
const { formatStepMessage } = require('../../shared/utils/operations/formatting');
const { response } = require('../../shared/http/responses');
const { createDomainError } = require('./shared/errors');
const { crossDomainFeature } = require('../other-domain/feature-name');

// === BUSINESS WORKFLOWS ===
async function mainBusinessWorkflow(params, config) {
  // Step 1: High-level business step
  // Step 2: Next business step  
  // Step 3: Final business step
}

// === FEATURE OPERATIONS ===
async function coordinatingOperation(params, config) {
  // Mid-level coordination logic
}

// === FEATURE UTILITIES ===
function featureSpecificUtility(data) {
  // Simple, focused implementation
}

module.exports = {
  // Business workflows (main exports)
  mainBusinessWorkflow,
  
  // Feature operations (available if needed)
  coordinatingOperation,
  
  // Feature utilities (internal, but exportable)
  featureSpecificUtility,
};
```

### Success Criteria

- [ ] **Parallel Files Built** - All new feature files created alongside existing
- [ ] **Isolated Validation** - New files pass syntax and linting checks
- [ ] **Atomic Import Switch** - All imports updated simultaneously
- [ ] **Complete System Test** - All actions work with new feature-first architecture
- [ ] **Old Structure Removed** - Layer-first directories deleted after validation
- [ ] **Zero Downtime** - No broken intermediate states during transition

### Validation Commands

```bash
# STEP 1: Validate parallel development
find src/ -name "*.js" | grep -E "(rest-export|mesh-export|file-browser)" # New files exist
find src/ -name "workflows" -o -name "operations" -o -name "utils" -type d # Old structure still exists

# STEP 2: Test complete new system
npm run deploy
npm run test:action get-products
npm run test:action get-products-mesh
```

---

## Phase 6: Surface-Level Compliance (Week 6)

### Objective

**Fix remaining small issues**: 6 step comments + 12 file headers + 8 naming + 3 file structure.

### Tasks

#### 6.1 Add Step Comments (6 Files)

**Add workflow step comments to audit-identified files:**

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
  };
}
```

#### 6.2 Add File Headers (12 Files)

**Add descriptive headers to large files lacking them:**

```javascript
/**
 * [Domain] [Feature Name]
 *
 * Complete [feature description] capability with all supporting functions
 */
```

#### 6.3 Fix Naming Conventions (8 Files)

**Correct camelCase/kebab-case violations found by audit.**

#### 6.4 Fix File Structure Issues (3 Files)

**Address structural violations in audit-identified files.**

### Success Criteria

- [ ] **Step Comments Fixed** - All 6 workflow functions have step comments
- [ ] **File Headers Added** - All 12 large files have descriptive headers  
- [ ] **Naming Fixed** - All 8 naming violations corrected
- [ ] **Structure Fixed** - All 3 structural issues resolved
- [ ] **Audit Success** - step-comments, file-header-comments, naming-conventions, file-structure-compliance all show 0 failures

### Validation Commands

```bash
# Audit all minor categories
npm run audit | grep "step-comments"
npm run audit | grep "file-header-comments" 
npm run audit | grep "naming-conventions"
npm run audit | grep "file-structure-compliance"
```

---

## Phase 7: Export Patterns (Week 7)

### Objective

**FIX 110 FILES** with missing export organization comments - the #1 audit violation.

### Tasks

#### 7.1 Audit-Identified Export Pattern Violations

**Address ALL 110 files found by audit with missing export comments:**

Files need these organization comments in their `module.exports`:

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

#### 7.2 Fix Complex Export Files

**Target specific files identified by audit:**

- `config/index.js` - Add export organization comments
- `scripts/build/operations/config-generation.js` - Add export organization comments
- `scripts/core/formatting.js` - Add export organization comments
- `src/commerce/operations/api-requests.js` - Add export organization comments
- `src/products/operations/transformation.js` - Add export organization comments
- And **105 other files** identified by the audit

#### 7.3 Standardize Export Patterns

**Apply consistent export organization across all affected files:**

```javascript
// === EXPORTS ORGANIZATION ===

module.exports = {
  // Business workflows (main exports that actions and other files import)
  exportProducts,
  processData,
  
  // Feature operations (mid-level functions available if needed)
  coordinateOperation,
  validateInput,
  
  // Feature utilities (building blocks, internal but exportable)
  transformData,
  formatOutput,
};
```

#### 7.4 Fix Multiple Export Pattern Issues

**Address 2 files with multiple module.exports statements:**

- `scripts/audit-unused-code.js` - Consolidate to single export
- `scripts/audit.js` - Consolidate to single export

### Success Criteria

- [ ] **All 110 Files Fixed** - Export organization comments added to all identified files
- [ ] **Export Pattern Compliance** - No multiple module.exports statements
- [ ] **Organization Comments** - Consistent "// Business workflows", "// Feature operations" structure
- [ ] **Complex Export Organization** - Files with 3+ exports have proper organization
- [ ] **Audit Success** - export-patterns shows 0 failures (from 110)

### Validation Commands

```bash
# Audit export patterns (main metric)
npm run audit | grep "export-patterns"

# Verify organization comments exist
grep -r "// Business workflows" src/ scripts/ config/
grep -r "// Feature operations" src/ scripts/ config/

# Check for multiple exports (should be 0)
grep -r "module.exports.*=" src/ scripts/ config/ | grep -v "module.exports = {"
```

---

## Phase 8: JSDoc Documentation (Week 8)

### Objective

**FIX 170 FILES** with missing @purpose and @usedBy tags in JSDoc documentation.

### Tasks

#### 8.1 Address Audit-Identified JSDoc Violations

**Target the EXACT 170 files found by audit missing JSDoc compliance:**

Each function needs complete JSDoc with required tags:

```javascript
/**
 * [Brief function description]
 * @purpose Brief function purpose in Feature-First DDD context
 * @param {Type} param1 - Parameter description
 * @param {Type} [param2=default] - Optional parameter
 * @returns {Promise<Type>} Return description
 * @throws {Error} When validation fails
 * @usedBy function name in file, function name in file, function name in file
 * @config commerce.baseUrl, commerce.credentials for dependency injection
 */
function exampleFunction(param1, param2 = 'default') {
  // Implementation
}
```

#### 8.2 @usedBy Tag Standards Implementation

**Apply consistent @usedBy patterns across all functions:**

```javascript
// Active usage examples
/**
 * @usedBy get-products action, exportProducts in mesh-export.js
 */

// Unused function examples  
/**
 * @usedBy Currently unused - available for future implementation
 */

// Legacy function examples
/**
 * @usedBy Currently unused - legacy function (consider removal)  
 */

// Public API examples
/**
 * @usedBy Currently unused - public API for external consumption
 */
```

#### 8.3 Process High-Priority Files First

**Start with action files, then workflows, then operations, then utilities:**

1. **Actions (5 files)** - get-products, get-products-mesh, browse-files, etc.
2. **Workflows (15 files)** - Core business logic files
3. **Operations (50 files)** - Coordination logic files  
4. **Utilities (100 files)** - Supporting function files

#### 8.4 Configuration Documentation

**Add @config tags to workflow functions:**

```javascript
/**
 * Products REST Export Feature
 * @purpose Execute complete product export workflow with REST API integration
 * @param {Object} config - Complete configuration object  
 * @returns {Promise<Object>} Export result with CSV data and storage info
 * @usedBy get-products action
 * @config commerce.baseUrl, commerce.api.timeout, products.fields, storage.provider
 */
```

### Success Criteria

- [ ] **All 170 Files Fixed** - JSDoc compliance achieved for all audit-identified files
- [ ] **@purpose Tags** - All functions have clear purpose documentation
- [ ] **@usedBy Tags** - All functions document their usage with standardized patterns
- [ ] **@config Tags** - Workflow functions document configuration requirements
- [ ] **Format Consistency** - Standard JSDoc format across all functions
- [ ] **Audit Success** - jsdoc-documentation shows 0 failures (from 170)

### Validation Commands

```bash
# Audit JSDoc compliance (main metric)
npm run audit | grep "jsdoc-documentation"

# Verify required tags exist
grep -r "@purpose" src/ actions/ scripts/
grep -r "@usedBy" src/ actions/ scripts/
grep -r "@config" src/ actions/ scripts/

# Count functions with complete JSDoc
grep -r "^\s*\*.*@purpose.*@usedBy" src/ actions/ scripts/ | wc -l
```

---

## Phase 9: Minor Fixes (Week 9)

### Objective

**Fix remaining small issues**: 6 step comments + 12 file headers + 8 naming + 3 file structure.

### Tasks

#### 9.1 Add Step Comments (6 Files)

**Add workflow step comments to audit-identified files:**

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
  };
}
```

#### 9.2 Add File Headers (12 Files)

**Add descriptive headers to large files lacking them:**

```javascript
/**
 * [Domain] [Feature Name]
 *
 * Complete [feature description] capability with all supporting functions
 */
```

#### 9.3 Fix Naming Conventions (8 Files)

**Correct camelCase/kebab-case violations found by audit.**

#### 9.4 Fix File Structure Issues (3 Files)

**Address structural violations in audit-identified files.**

### Success Criteria

- [ ] **Step Comments Fixed** - All 6 workflow functions have step comments
- [ ] **File Headers Added** - All 12 large files have descriptive headers  
- [ ] **Naming Fixed** - All 8 naming violations corrected
- [ ] **Structure Fixed** - All 3 structural issues resolved
- [ ] **Audit Success** - step-comments, file-header-comments, naming-conventions, file-structure-compliance all show 0 failures

### Validation Commands

```bash
# Audit all minor categories
npm run audit | grep "step-comments"
npm run audit | grep "file-header-comments" 
npm run audit | grep "naming-conventions"
npm run audit | grep "file-structure-compliance"
```

---

## Phase 10: Final Validation & Optimization (Week 10)

### Objective

Complete validation and achieve **ZERO Tier 1 failures**.

### Tasks

#### 10.1 Comprehensive Audit Compliance

**Achieve target metrics:**

- **export-patterns**: 0 failures (from 110)
- **jsdoc-documentation**: 0 failures (from 170)  
- **import-organization**: 0 failures (from 45)
- **action-framework-compliance**: 0 failures (from 5)
- **All other Tier 1 rules**: 0 failures

#### 10.2 Full System Testing

**Validate complete functionality:**

- All 5 actions work correctly
- All npm scripts function properly
- No regression in existing capabilities
- Performance benchmarks maintained

### Success Criteria

- [ ] **Zero Tier 1 Failures** - All critical issues resolved
- [ ] **95%+ Overall Compliance** - High architecture compliance achieved
- [ ] **Full Functionality** - All existing capabilities preserved
- [ ] **Performance Maintained** - No performance regressions

### Validation Commands

```bash
# Final audit (target: 0 Tier 1 failures)
npm run audit

# Comprehensive testing
npm run test:action get-products
npm run test:action get-products-mesh
npm run test:action browse-files

# Performance validation
npm run test:perf:compare

# Deployment test
npm run deploy
```

---

## Progress Tracking (AUDIT-ALIGNED)

### Completion Metrics

| Phase | Audit Target | Files/Issues | Duration | Success Criteria | Status |
|-------|-------------|--------------|----------|------------------|---------|
| 1 | Foundation | 3 files | Week 1 | Core → Shared migration | ⏳ Pending |
| 2 | **Feature-First File Organization** | **110 files** | Week 2 | Export organization comments | ⏳ Pending |
| 3 | **Function Organization** | **170 files** | Week 3 | @purpose/@usedBy tags | ⏳ Pending |
| 4 | **Action Framework** | **5 actions** | Week 4 | createAction() usage | ⏳ Pending |
| 5 | **Domain Boundaries** | **4 domains** | Week 5 | Feature-First organization | ⏳ Pending |
| 6 | **Surface-Level Compliance** | **29 files** | Week 6 | Steps/headers/naming/structure | ⏳ Pending |
| 7 | **Export Patterns** | **110 files** | Week 7 | Export organization comments | ⏳ Pending |
| 8 | **JSDoc Documentation** | **170 files** | Week 8 | @purpose/@usedBy tags | ⏳ Pending |
| 9 | **Minor Fixes** | **29 files** | Week 9 | Steps/headers/naming/structure | ⏳ Pending |
| 10 | **Final Validation** | **All systems** | Week 10 | Zero Tier 1 failures | ⏳ Pending |

### Audit Progress Tracking (TARGET METRICS)

**Current Baseline (Before Implementation):**

- **export-patterns**: 110 failures → **TARGET: 0**
- **jsdoc-documentation**: 170 failures → **TARGET: 0**
- **import-organization**: 45 failures → **TARGET: 0**
- **action-framework-compliance**: 5 failures → **TARGET: 0**
- **step-comments**: 6 failures → **TARGET: 0**
- **file-header-comments**: 12 failures → **TARGET: 0**
- **naming-conventions**: 8 failures → **TARGET: 0**
- **file-structure-compliance**: 3 failures → **TARGET: 0**

**Overall Target:**

- **Tier 1 Failures**: 501 → **0**
- **Overall Compliance**: 79% → **>95%**

This comprehensive plan transforms the application with **audit-driven priorities** ensuring we address the actual violations found, not theoretical issues. The corrected phase order tackles the highest violation counts first for maximum impact.
