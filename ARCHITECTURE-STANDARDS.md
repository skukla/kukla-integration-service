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

## Universal Feature-First Architecture

### CRITICAL: Feature-First Organization Everywhere

**ALL code in this repository follows identical Feature-First DDD organization, regardless of location.**

**Universal Principle:** Whether in `src/`, `actions/`, or `scripts/`, every directory uses Feature-First organization with complete business capabilities in single files or organized sub-modules.

#### **No Architecture Exceptions**

- ✅ **`src/` domains** - Feature-First organization (products, files, commerce, htmx, testing)
- ✅ **`actions/` capabilities** - Feature-First organization (thin orchestration, domain delegation)
- ✅ **`scripts/` operations** - Feature-First organization (deployment, monitoring, auditing)
- ✅ **`shared/` infrastructure** - Feature-First organization (action framework, HTTP utilities)

#### **Shared vs Domain Classification**

**Primary Domains (`src/`):**

- **Products** - Product export, transformation, enrichment capabilities
- **Files** - File management, storage, browser capabilities  
- **Commerce** - Commerce API integration, authentication capabilities
- **HTMX** - UI generation, modal interaction, notification capabilities
- **Testing** - Test execution, validation, performance measurement capabilities

**Infrastructure (`shared/`):**

- **Action Framework** - Action creation, context building, error handling
- **HTTP Utilities** - Request/response handling, parameter extraction
- **Validation** - Cross-domain validation rules and utilities
- **Utils** - Universal async, formatting, caching utilities

**Scripts (`scripts/`):**

- **Operational Capabilities** - Deployment, monitoring, auditing, testing workflows

#### **Migration Benefits**

**Cognitive Consistency:**

- ✅ **Same mental model** - Identical organization patterns across all code contexts
- ✅ **No context switching** - Same Feature-First approach whether building features or scripts
- ✅ **Predictable structure** - Progressive disclosure (workflows → operations → utilities) everywhere

**Development Efficiency:**

- ✅ **Unified standards** - Same code quality, ESLint rules, and patterns across all directories
- ✅ **Easy maintenance** - Same debugging and modification patterns everywhere
- ✅ **Clear ownership** - Same responsibility boundaries and documentation standards

---

## Domain Structure Standards: DDD + Feature-First

### CRITICAL: Domain Boundaries + Feature Cohesion

**Domain boundaries remain sacred** (DDD principle), but **features are organized for cognitive efficiency** within each domain.

**Core Principle:** Each file represents a **complete business capability** with composite → atomic organization internally.

### Main Application (`src/`)

```text
src/
├── products/                   # Product domain (DDD bounded context)
│   ├── rest-export.js         # Feature CORE (workflows + operations)
│   ├── rest-export/           # Feature SUB-MODULES (when >400 lines)
│   │   ├── enrichment.js      # Enrichment utilities (category/inventory)
│   │   ├── transformation.js  # Product transformation utilities
│   │   ├── csv-generation.js  # CSV generation utilities
│   │   └── validation.js      # REST-specific validation
│   ├── mesh-export.js         # Feature CORE (workflows + operations)
│   ├── mesh-export/           # Feature SUB-MODULES (when >400 lines)
│   │   ├── graphql.js         # GraphQL query utilities
│   │   ├── mesh-requests.js   # Mesh API utilities
│   │   └── validation.js      # Mesh-specific validation
│   └── shared/                # Only truly shared utilities (3+ features)
│       ├── csv-generation.js  # Cross-feature CSV utilities
│       ├── data-validation.js # Cross-feature validation
│       ├── image-processing.js # Cross-feature image utilities
│       └── errors.js          # Domain-specific error handling
├── files/                     # File operations domain (DDD bounded context)
│   ├── csv-export.js          # Feature CORE (workflows + operations)
│   ├── csv-export/            # Feature SUB-MODULES (when >400 lines)
│   │   ├── storage-strategies.js # Storage selection utilities
│   │   ├── url-generation.js  # Presigned URL utilities
│   │   ├── metadata.js        # File metadata processing
│   │   └── validation.js      # CSV-specific validation
│   ├── file-browser.js        # Feature CORE (workflows + operations)
│   ├── file-browser/          # Feature SUB-MODULES (when >400 lines)
│   │   ├── ui-generation.js   # HTML generation utilities
│   │   ├── navigation.js      # Directory navigation utilities
│   │   ├── filtering.js       # File filtering utilities
│   │   └── validation.js      # Browser-specific validation
│   ├── file-download.js       # Feature CORE (workflows + operations)
│   ├── file-download/         # Feature SUB-MODULES (when >400 lines)
│   │   ├── url-generation.js  # Download URL utilities
│   │   ├── access-control.js  # Download permission utilities
│   │   └── validation.js      # Download-specific validation
│   ├── file-deletion.js       # Feature CORE (workflows + operations)
│   ├── file-deletion/         # Feature SUB-MODULES (when >400 lines)
│   │   ├── confirmation.js    # Deletion confirmation utilities
│   │   ├── cleanup.js         # File cleanup utilities
│   │   └── validation.js      # Deletion-specific validation
│   └── shared/                # Only truly shared utilities (3+ features)
│       ├── storage-strategies.js # Cross-feature storage selection
│       ├── presigned-urls.js  # Cross-feature URL generation
│       ├── path-utilities.js  # Cross-feature path processing
│       └── errors.js          # Domain-specific error handling
├── htmx/                      # HTMX domain (DDD bounded context)
│   ├── file-browser-ui.js     # Feature CORE (workflows + operations)
│   ├── file-browser-ui/       # Feature SUB-MODULES (when >400 lines)
│   │   ├── html-generation.js # HTML component utilities
│   │   ├── table-generation.js # File table utilities
│   │   ├── modal-generation.js # Modal HTML utilities
│   │   └── validation.js      # UI-specific validation
│   ├── modal-interactions.js  # Feature CORE (workflows + operations)
│   ├── modal-interactions/    # Feature SUB-MODULES (when >400 lines)
│   │   ├── confirmation-modals.js # Confirmation modal utilities
│   │   ├── form-modals.js     # Form modal utilities
│   │   ├── response-handling.js # Modal response utilities
│   │   └── validation.js      # Modal-specific validation
│   ├── notification-system.js # Feature CORE (workflows + operations)
│   ├── notification-system/   # Feature SUB-MODULES (when >400 lines)
│   │   ├── toast-generation.js # Toast notification utilities
│   │   ├── alert-generation.js # Alert notification utilities
│   │   ├── progress-indicators.js # Progress display utilities
│   │   └── validation.js      # Notification-specific validation
│   └── shared/                # Only truly shared utilities (3+ features)
│       ├── html-generation.js # Cross-feature HTML utilities
│       ├── response-building.js # Cross-feature HTMX responses
│       └── errors.js          # Domain-specific error handling
├── commerce/                  # Commerce integration domain (DDD bounded context)
│   ├── product-fetching.js    # Feature CORE (workflows + operations)
│   ├── product-fetching/      # Feature SUB-MODULES (when >400 lines)
│   │   ├── api-requests.js    # Commerce API utilities
│   │   ├── pagination.js      # Product pagination utilities
│   │   ├── filtering.js       # Product filtering utilities
│   │   └── validation.js      # Fetching-specific validation
│   ├── category-enrichment.js # Feature CORE (workflows + operations)
│   ├── category-enrichment/   # Feature SUB-MODULES (when >400 lines)
│   │   ├── category-mapping.js # Category mapping utilities
│   │   ├── hierarchy-building.js # Category hierarchy utilities
│   │   ├── data-enrichment.js # Category data utilities
│   │   └── validation.js      # Category-specific validation
│   ├── inventory-enrichment.js # Feature CORE (workflows + operations)
│   ├── inventory-enrichment/  # Feature SUB-MODULES (when >400 lines)
│   │   ├── stock-fetching.js  # Stock data utilities
│   │   ├── availability-calc.js # Availability calculation utilities
│   │   ├── batch-processing.js # Inventory batch utilities
│   │   └── validation.js      # Inventory-specific validation
│   ├── admin-token-auth.js    # Feature CORE (workflows + operations)
│   ├── admin-token-auth/      # Feature SUB-MODULES (when >400 lines)
│   │   ├── token-management.js # Token lifecycle utilities
│   │   ├── credential-validation.js # Credential validation utilities
│   │   ├── session-handling.js # Session management utilities
│   │   └── validation.js      # Auth-specific validation
│   └── shared/                # Only truly shared utilities (3+ features)
│       ├── api-client.js      # Cross-feature API client
│       ├── request-batching.js # Cross-feature batching
│       └── errors.js          # Domain-specific error handling
├── testing/                   # Testing domain (DDD bounded context)
│   ├── action-testing.js      # Feature CORE (workflows + operations)
│   ├── action-testing/        # Feature SUB-MODULES (when >400 lines)
│   │   ├── execution.js       # Action test execution utilities
│   │   ├── validation.js      # Action test validation utilities
│   │   └── formatting.js      # Action test formatting utilities
│   ├── api-testing.js         # Feature CORE (workflows + operations)
│   ├── api-testing/           # Feature SUB-MODULES (when >400 lines)
│   │   ├── endpoint-testing.js # API endpoint testing utilities
│   │   ├── response-validation.js # API response validation utilities
│   │   └── performance-measurement.js # API performance utilities
│   ├── performance-testing.js # Feature CORE (workflows + operations)
│   ├── performance-testing/   # Feature SUB-MODULES (when >400 lines)
│   │   ├── scenario-execution.js # Performance scenario utilities
│   │   ├── metrics-collection.js # Performance metrics utilities
│   │   ├── baseline-comparison.js # Performance baseline utilities
│   │   └── reporting.js       # Performance reporting utilities
│   ├── test-orchestration.js  # Feature CORE (workflows + operations)
│   ├── test-orchestration/    # Feature SUB-MODULES (when >400 lines)
│   │   ├── suite-management.js # Test suite management utilities
│   │   ├── parallel-execution.js # Parallel test execution utilities
│   │   └── result-aggregation.js # Test result aggregation utilities
│   └── shared/                # Only truly shared utilities (3+ features)
│       ├── test-utilities.js  # Cross-feature test utilities
│       ├── assertion-helpers.js # Cross-feature assertion utilities
│       └── errors.js          # Domain-specific error handling
└── shared/                    # Cross-domain infrastructure utilities (NOT business domains)
    ├── action/               # Action framework infrastructure
    │   ├── action-factory.js # Complete action framework capability
    │   ├── context-building.js # Action context utilities
    │   ├── error-handling.js # Action error utilities
    │   ├── initialization.js # Action setup utilities
    │   └── logger-setup.js   # Action logging utilities
    ├── errors.js             # Error handling infrastructure (single file)
    ├── http/                 # HTTP client infrastructure
    │   ├── client.js         # HTTP client utilities
    │   ├── responses.js      # HTTP response utilities
    │   ├── config.js         # HTTP configuration utilities
    │   ├── params.js         # HTTP parameter utilities
    │   └── request.js        # HTTP request utilities
    ├── routing/              # URL management infrastructure
    │   ├── runtime.js        # Runtime URL building
    │   └── commerce.js       # Commerce URL building
    ├── validation/           # Validation infrastructure
    │   ├── parameters.js     # Parameter validation
    │   ├── product.js        # Product validation
    │   └── types.js          # Validation type utilities
    └── utils/                # Universal utilities
        ├── async.js          # Universal async utilities
        ├── cache.js          # Universal caching utilities
        ├── formatting.js     # Universal formatting utilities
        └── graphql.js        # Universal GraphQL utilities
```

### Feature Organization Principles

**CRITICAL: Features represent complete business capabilities that users can understand and interact with directly.**

#### **1. User-Centric Feature Definition**

Features should align with **user mental models** and **business capabilities**:

```javascript
// ✅ CORRECT: User-focused features
products/rest-export.js         # "Export products via REST API"
products/mesh-export.js         # "Export products via API Mesh"  
files/file-browser.js           # "Browse and select files"
files/csv-export.js             # "Export data as CSV file"
commerce/product-fetching.js    # "Fetch products from Commerce"

// ❌ WRONG: Technical implementation features
products/api-layer.js           # Technical abstraction
products/data-processor.js      # Implementation detail
files/storage-abstraction.js    # Infrastructure concern
```

#### **2. Complete Feature Cohesion**

**Each feature file contains everything needed to understand and maintain that capability:**

```javascript
/**
 * Products REST Export
 * Complete product export capability via Commerce REST API
 */

// === BUSINESS WORKFLOWS === (What actions use)
async function exportProducts(params, config) {
  // Step 1: Validate export parameters
  // Step 2: Fetch and enrich products  
  // Step 3: Transform for export
  // Step 4: Generate CSV
  // Step 5: Store file
}

// === FEATURE OPERATIONS === (Coordination logic)
async function fetchAndEnrichProducts(params, config) { }
async function transformProductData(products, config) { }
async function generateProductCsv(products, config) { }

// === FEATURE UTILITIES === (Building blocks)
function validateProductFields(fields) { }
function formatProductPrice(price, currency) { }
function buildProductImageUrl(product, config) { }

**Export Organization Rules:**

```javascript
// ✅ CORRECT: Files with ≤5 exports and clear sections - NO export comments needed
module.exports = {
  exportProductsWithStorageAndFallback,  // Most comprehensive first
  exportProducts,
  fetchAndEnrichProducts,
  transformProductData,
  validateProductFields,
};

// ✅ CORRECT: Files with 6+ exports or unclear organization - USE export comments
module.exports = {
  // Business workflows (main exports that actions import)
  exportProducts,
  processProducts,
  validateProducts,
  
  // Feature operations (coordination functions)
  fetchAndEnrichProducts,
  transformProductData,
  enrichWithCategories,
  enrichWithInventory,
  
  // Feature utilities (building blocks)
  validateProductFields,
  formatProductPrice,
  buildProductImageUrl,
};
```

**Section Header Standards:**

```javascript
// ✅ CORRECT: Simple, readable section headers
// Business Workflows
// Feature Operations
// Feature Utilities

// ❌ WRONG: "Shouty" triple-equals format (visual noise)
// === BUSINESS WORKFLOWS ===
// === FEATURE OPERATIONS ===

// ❌ WRONG: Redundant export header (module.exports is clear enough)
// === EXPORTS ORGANIZATION ===
module.exports = { };
```

#### **3. Progressive Disclosure Pattern**

**Features follow complexity hierarchy from MOST COMPREHENSIVE to most detailed:**

**CRITICAL: Within each section, most comprehensive functions come FIRST:**

1. **Business Workflows** (Composite) - Complete user-facing capabilities
   - **Order**: Most comprehensive workflow → Supporting workflows
2. **Feature Operations** (Coordination) - Multi-step business logic coordination  
   - **Order**: Higher-level coordination → Lower-level coordination
3. **Feature Utilities** (Atomic) - Simple, focused building blocks
   - **Order**: Most complex utilities → Simple utilities

```javascript
// Business Workflows
async function exportProductsWithStorageAndFallback(params, config, core) {
  // MOST comprehensive - entry point for actions
  const exportResult = await exportProducts(params, config);
  // ... storage handling
}

async function exportProducts(params, config) {
  // LESS comprehensive - called by above
  // ... core export logic
}

// Reading from top to bottom:
// 1. Understand WHAT the feature does (most comprehensive first)
// 2. Understand HOW it coordinates (supporting functions)  
// 3. Understand building blocks (utilities)
```

#### **4. Domain Boundary Respect**

**Features respect DDD domain boundaries while providing complete capabilities:**

```text
✅ CORRECT Domain Organization:
src/products/       # Product domain
├── rest-export.js  # Complete export via REST
├── mesh-export.js  # Complete export via Mesh
└── shared/         # Cross-feature utilities

✅ CORRECT Cross-Domain Usage:
products/rest-export.js can import from:
- files/csv-export.js (cross-domain interface)
- shared/http/client.js (infrastructure)
- ./shared/validation.js (domain utilities)

❌ WRONG: Domain bleeding
products/rest-export.js importing:
- files/operations/file-handling.js (internal implementation)
- commerce/utils/api-helpers.js (domain internals)
```

#### **5. Shared Function Strategy**

**Only extract to shared/ when truly used by 3+ features:**

```javascript
// === THREE-TIER DECISION TREE ===

// Tier 1: src/shared/ (3+ domains use it)
const { formatStepMessage } = require('../../shared/utils/formatting');

// Tier 2: domain/shared/ (3+ features in domain use it)  
const { validateProductData } = require('./shared/validation');

// Tier 3: Keep in feature file (1-2 features use it)
function validateExportFields(fields) { /* feature-specific logic */ }
```

#### **6. Import Transparency**

**All dependencies visible at top of file for cognitive efficiency:**

```javascript
// All dependencies at top of file - grouping is obvious from paths
const { response } = require('../../shared/http/responses');
const { validateProducts } = require('./shared/validation');
const { storeCsvFile } = require('../files/csv-export');
```

#### **7. Feature Testing Independence**

**Each feature should be testable independently:**

```javascript
// ✅ CORRECT: Feature accepts any valid config
async function exportProducts(params, config) {
  const timeout = config.commerce.api.timeout; // Trust config
  const baseUrl = config.commerce.baseUrl;     // Trust config
}

// ✅ CORRECT: Feature test with mock config
const mockConfig = {
  commerce: { api: { timeout: 5000 }, baseUrl: 'test-url' },
  products: { fields: ['sku', 'name'] }
};

await exportProducts(testParams, mockConfig);
```

#### **8. Business Logic Concentration**

**Features concentrate related business logic for maintainability:**

```javascript
// ✅ CORRECT: Related product export logic in one file
products/rest-export.js:
- Product fetching logic
- Product enrichment logic  
- CSV generation logic
- Export validation logic
- Error handling for export

// ❌ WRONG: Scattered across multiple files
products/fetching/operations/get-products.js
products/enrichment/operations/add-categories.js  
products/export/operations/csv-generation.js
products/validation/operations/export-validation.js
```

#### **9. Clear Feature Contracts**

**Features provide clear interfaces with explicit contracts:**

```javascript
/**
 * Products REST Export
 * 
 * @purpose Export product data as CSV using Commerce REST API
 * @param {Object} params - Export parameters (filters, pagination, etc.)
 * @param {Object} config - Complete application configuration
 * @returns {Promise<Object>} Export result with CSV data and metadata
 * @throws {Error} When Commerce API is unavailable or data is invalid
 * 
 * @usedBy get-products action
 * @config commerce.baseUrl, commerce.api.timeout, products.fields
 * 
 * @example
 * const result = await exportProducts(
 *   { limit: 100, category: 'electronics' },
 *   config
 * );
 * // Returns: { csvData: '...', productCount: 87, fileSize: '15KB' }
 */
async function exportProducts(params, config) {
  // Implementation
}
```

#### **10. Evolutionary Design**

**Features can evolve without breaking architectural boundaries:**

```javascript
// ✅ CORRECT: Feature evolution within boundaries
products/rest-export.js:
// Version 1: Basic product export
// Version 2: + Category enrichment  
// Version 3: + Image processing
// Version 4: + Performance optimization

// Domain boundary preserved, feature becomes more comprehensive

// ❌ WRONG: Feature evolution breaks boundaries
products/rest-export.js → 
products/rest-export-with-files.js →
products/rest-export-with-files-and-commerce.js
// Domain bleeding, unclear responsibilities
```

### **11. Feature-First File Size Management**

**CRITICAL: When feature files exceed 400 lines, use Feature Core + Sub-modules pattern to maintain cognitive efficiency without creating unwieldy files.**

#### **The File Size Challenge**

Pure Feature-First consolidation can create very large files (700+ lines) that become difficult to maintain despite excellent organization. The solution is a **hybrid approach** that preserves Feature-First cognitive benefits while managing file size.

#### **Feature Core + Sub-modules Pattern**

```text
src/products/
├── rest-export.js              # Feature CORE (200-400 lines)
├── rest-export/               # Feature SUB-MODULES  
│   ├── enrichment.js          # Category/inventory enrichment (50-150 lines)
│   ├── transformation.js      # Product transformation (50-150 lines)
│   ├── csv-generation.js      # CSV utilities (50-150 lines)
│   └── validation.js          # REST validation (50-150 lines)
├── mesh-export.js             # Feature CORE (200-400 lines)
├── mesh-export/               # Feature SUB-MODULES
│   ├── graphql.js            # GraphQL queries (50-150 lines)
│   ├── mesh-requests.js      # Mesh API utilities (50-150 lines)
│   └── validation.js         # Mesh validation (50-150 lines)
└── shared/                    # Cross-feature utilities (unchanged)
```

#### **Feature Core Responsibilities (Target: 200-400 lines)**

**The main feature file remains the primary interface and contains:**

```javascript
/**
 * Products REST Export - Feature Core
 * Complete REST API product export capability with organized sub-modules
 */

// Import from feature sub-modules (same domain)
const { enrichWithCategories, enrichWithInventory } = require('./rest-export/enrichment');
const { buildProductObject, transformProductData } = require('./rest-export/transformation');
const { generateCsvHeaders, formatCsvData } = require('./rest-export/csv-generation');
const { validateInput, validateProductFetchConfig } = require('./rest-export/validation');

// Import from other domains (cross-domain interfaces)
const { exportCsvWithStorage } = require('../files/csv-export');
const { executeAdminTokenCommerceRequest } = require('../commerce/operations/api-requests');

// === BUSINESS WORKFLOWS === (Complete feature entry points)
async function exportProductsWithStorageAndFallback(params, config) {
  // Main workflow - 30-50 lines
}

async function exportProducts(params, config) {
  // Core workflow - 20-30 lines
}

// === FEATURE OPERATIONS === (Coordination logic)
async function fetchAndEnrichProducts(params, config) {
  // Coordinates enrichment sub-modules - 20-40 lines
  const products = await fetchProducts(params, config);
  const categorized = await enrichWithCategories(products, config, params);
  const enriched = await enrichWithInventory(categorized, config, params);
  return enriched;
}

async function buildProducts(products, config) {
  // Coordinates transformation sub-modules - 15-25 lines
  return transformProductData(products, config);
}

// === CORE FEATURE UTILITIES === (Kept in main file if simple)
async function fetchProducts(params, config) {
  // Product fetching logic - 30-50 lines (or move to sub-module if larger)
}

module.exports = {
  // Business workflows (primary feature interface)
  exportProductsWithStorageAndFallback,
  exportProducts,
  
  // Feature operations (available for extension)
  fetchAndEnrichProducts,
  buildProducts,
};
```

#### **Sub-module Organization Rules**

**When to create a sub-module:**

1. **Utility category has 5+ related functions** (enrichment, transformation, CSV)
2. **Category is 50+ lines** of related functionality
3. **Functions are tightly coupled** (all work with same data types)
4. **Category has clear boundary** (enrichment vs transformation vs CSV)

**Sub-module structure:**

```javascript
// rest-export/enrichment.js
/**
 * REST Export - Product Enrichment Sub-module
 * All product enrichment utilities for REST API export
 */

// Sub-module specific imports (can import from utils, not from sibling sub-modules)
const { getCategoryIds, extractProductSkus } = require('../utils/data');
const { executeAdminTokenBatchCommerceRequests } = require('../../commerce/operations/api-requests');

// === ENRICHMENT WORKFLOWS ===
async function enrichWithCategories(products, config, params) {
  // 20-30 lines
}

async function enrichWithInventory(products, config, params) {
  // 20-30 lines  
}

// === ENRICHMENT UTILITIES ===
async function fetchCategoryData(categoryIds, config, params) {
  // 30-50 lines
}

async function fetchInventoryData(skus, config, params) {
  // 30-50 lines
}

function enrichProductsWithCategories(products, categoryMap) {
  // 15-25 lines
}

function enrichProductsWithInventory(products, inventoryMap) {
  // 15-25 lines
}

module.exports = {
  // Workflows (used by feature core)
  enrichWithCategories,
  enrichWithInventory,
  
  // Utilities (available for testing/extension)
  fetchCategoryData,
  fetchInventoryData,
  enrichProductsWithCategories,
  enrichProductsWithInventory,
};
```

#### **Sub-module Categories by Domain**

**Products Domain:**

- `enrichment.js` - Category and inventory enrichment utilities
- `transformation.js` - Product object building and standardization
- `csv-generation.js` - CSV formatting and generation utilities
- `graphql.js` - GraphQL query utilities (mesh-export)
- `mesh-requests.js` - Mesh API utilities (mesh-export)
- `validation.js` - REST/Mesh-specific validation functions

**Files Domain:**

- `storage-strategies.js` - Storage provider selection and configuration
- `url-generation.js` - Presigned URL and download URL utilities
- `metadata.js` - File metadata extraction and processing
- `ui-generation.js` - HTML generation utilities (file-browser)
- `navigation.js` - Directory navigation utilities (file-browser)
- `filtering.js` - File filtering utilities (file-browser)
- `access-control.js` - Download permission utilities (file-download)
- `confirmation.js` - Deletion confirmation utilities (file-deletion)
- `cleanup.js` - File cleanup utilities (file-deletion)
- `validation.js` - File operation validation

**HTMX Domain:**

- `html-generation.js` - HTML component utilities (file-browser-ui)
- `table-generation.js` - File table utilities (file-browser-ui)
- `modal-generation.js` - Modal HTML utilities (file-browser-ui)
- `confirmation-modals.js` - Confirmation modal utilities (modal-interactions)
- `form-modals.js` - Form modal utilities (modal-interactions)
- `response-handling.js` - Modal response utilities (modal-interactions)
- `toast-generation.js` - Toast notification utilities (notification-system)
- `alert-generation.js` - Alert notification utilities (notification-system)
- `progress-indicators.js` - Progress display utilities (notification-system)
- `validation.js` - UI/modal/notification-specific validation

**Commerce Domain:**

- `api-requests.js` - Commerce API request utilities (product-fetching)
- `pagination.js` - Product pagination utilities (product-fetching)
- `filtering.js` - Product filtering utilities (product-fetching)
- `category-mapping.js` - Category mapping utilities (category-enrichment)
- `hierarchy-building.js` - Category hierarchy utilities (category-enrichment)
- `data-enrichment.js` - Category data utilities (category-enrichment)
- `stock-fetching.js` - Stock data utilities (inventory-enrichment)
- `availability-calc.js` - Availability calculation utilities (inventory-enrichment)
- `batch-processing.js` - Inventory batch utilities (inventory-enrichment)
- `token-management.js` - Token lifecycle utilities (admin-token-auth)
- `credential-validation.js` - Credential validation utilities (admin-token-auth)
- `session-handling.js` - Session management utilities (admin-token-auth)
- `validation.js` - Domain-specific validation for each feature

#### **Import Rules for Sub-modules**

**✅ ALLOWED Sub-module Imports:**

```javascript
// From domain utils (same domain)
const { getCategoryIds } = require('../utils/data');

// From other domain operations (cross-domain interfaces)
const { executeAdminTokenCommerceRequest } = require('../../commerce/operations/api-requests');

// From shared infrastructure
const { formatStepMessage } = require('../../shared/utils/formatting');
```

**❌ FORBIDDEN Sub-module Imports:**

```javascript
// From sibling sub-modules (creates coupling)
const { transformProductData } = require('./transformation');

// From parent feature core (creates circular dependency)
const { exportProducts } = require('../rest-export');
```

#### **Benefits of Feature Core + Sub-modules**

**Maintains Feature-First Benefits:**

- ✅ **Single feature interface** - Main file is still the complete feature entry point
- ✅ **No file jumping** - All related functionality in feature directory
- ✅ **Progressive disclosure** - Core workflows → operations → utilities
- ✅ **Complete feature understanding** - Feature directory contains everything

**Addresses File Size Concerns:**

- ✅ **Manageable file sizes** - Core 200-400 lines, sub-modules 50-150 lines
- ✅ **Logical organization** - Related utilities grouped in meaningful sub-modules
- ✅ **Easy navigation** - Clear categories (enrichment, transformation, validation)
- ✅ **Focused maintenance** - Changes to CSV logic only affect csv-generation.js

**Preserves DDD Architecture:**

- ✅ **Domain boundaries** - Sub-modules are within domain boundaries
- ✅ **Feature cohesion** - All sub-modules serve the same feature
- ✅ **Clear ownership** - Feature team owns core + all sub-modules
- ✅ **Strategic duplication** - Sub-modules avoid cross-feature dependencies

#### **Migration Strategy for Large Features**

**When an existing feature file exceeds 400 lines:**

1. **Identify utility categories** (enrichment, transformation, CSV, validation)
2. **Create sub-module directories** (`feature-name/`)
3. **Extract categories to sub-modules** (groups of 5+ related functions)
4. **Update feature core imports** (import from sub-modules)
5. **Update external imports** (still import from feature core, not sub-modules)
6. **Test complete feature** (ensure no functionality breaks)

**Example Refactoring:**

```javascript
// BEFORE: Large feature file (774 lines)
src/products/rest-export.js                    // 774 lines - TOO LARGE

// AFTER: Feature core + sub-modules
src/products/rest-export.js                    // 250 lines - MANAGEABLE
src/products/rest-export/enrichment.js         // 120 lines - FOCUSED  
src/products/rest-export/transformation.js     // 150 lines - FOCUSED
src/products/rest-export/csv-generation.js     // 80 lines - FOCUSED
src/products/rest-export/validation.js         // 70 lines - FOCUSED
```

#### **Testing Strategy**

**Feature-level testing** (tests the complete feature):

```javascript
// Test the feature core (main interface)
const { exportProducts } = require('../src/products/rest-export');
```

**Sub-module testing** (tests utility categories):

```javascript
// Test enrichment utilities in isolation
const { enrichWithCategories } = require('../src/products/rest-export/enrichment');
```

This hybrid approach gives us the best of both worlds: **Feature-First cognitive benefits** with **manageable file sizes** and **clear organization boundaries**.

---

## Configuration Standards: User Preferences & Application Settings

### CRITICAL: Complete Configuration Architecture

**Configuration encompasses both infrastructure settings AND user preferences/application settings.**

### **Infrastructure Configuration (Already Covered)**

#### **Environment & Domain Configuration**

- ✅ Clean object access patterns (`config.commerce.baseUrl`)
- ✅ Dependency injection through function parameters
- ✅ No optional chaining with fallbacks in business logic
- ✅ Environment-specific overrides in config builders

#### **Feature Configuration Integration**

- ✅ Features receive complete config objects
- ✅ Config boundaries respected in Feature-First architecture
- ✅ Configuration testing with mock objects

### **User Preferences & Application Settings (NEW)**

#### **1. User Preference Architecture**

**User preferences should follow the same Feature-First DDD patterns:**

```javascript
// === USER PREFERENCES ORGANIZATION ===

config/user-preferences/
├── ui-preferences.js          # Complete UI preference management
├── export-preferences.js     # Complete export preference management  
├── notification-preferences.js # Complete notification preference management
└── shared/
    ├── preference-storage.js  # Cross-feature preference storage
    ├── preference-validation.js # Cross-feature validation
    └── preference-defaults.js  # Cross-feature default management
```

#### **2. User Preference Integration Pattern**

**User preferences integrate with infrastructure config:**

```javascript
// === COMPLETE CONFIGURATION OBJECT ===
function loadCompleteConfig(params, userPreferences = {}) {
  const infrastructureConfig = loadConfig(params);
  
  return {
    // Infrastructure configuration (environment-based)
    ...infrastructureConfig,
    
    // User preferences (user-specific)
    userPreferences: {
      ui: buildUiPreferences(userPreferences.ui),
      export: buildExportPreferences(userPreferences.export),
      notifications: buildNotificationPreferences(userPreferences.notifications)
    }
  };
}
```

#### **3. Feature-Level Preference Usage**

**Features use both infrastructure config and user preferences:**

```javascript
// === PRODUCTS REST EXPORT WITH PREFERENCES ===
async function exportProducts(params, config) {
  // Infrastructure configuration (trusted system)
  const { commerce, products } = config;
  const apiTimeout = commerce.api.timeout;
  const defaultFields = products.fields;
  
  // User preferences (optional customization)
  const { userPreferences } = config;
  const preferredFields = userPreferences.export.fields || defaultFields;
  const preferredFormat = userPreferences.export.format || 'csv';
  const includeImages = userPreferences.export.includeImages || false;
  
  // Step 1: Fetch products with user-preferred fields
  const products = await fetchProducts(params, {
    fields: preferredFields,
    timeout: apiTimeout
  });
  
  // Step 2: Apply user export preferences
  const exportOptions = {
    format: preferredFormat,
    includeImages: includeImages,
    headers: userPreferences.export.customHeaders || []
  };
  
  return await processExport(products, exportOptions);
}
```

#### **4. User Preference Categories**

**Organize preferences by user-facing capabilities:**

```javascript
// === UI PREFERENCES ===
const uiPreferences = {
  theme: 'dark' | 'light' | 'auto',
  language: 'en' | 'es' | 'fr',
  itemsPerPage: 25 | 50 | 100,
  defaultView: 'grid' | 'list',
  showTutorials: boolean,
  compactMode: boolean
};

// === EXPORT PREFERENCES ===
const exportPreferences = {
  defaultFormat: 'csv' | 'xlsx' | 'json',
  fields: ['sku', 'name', 'price', 'category'],
  includeImages: boolean,
  includeInventory: boolean,
  customHeaders: string[],
  emailNotification: boolean,
  autoDownload: boolean
};

// === NOTIFICATION PREFERENCES ===
const notificationPreferences = {
  exportComplete: boolean,
  errorAlerts: boolean,
  systemUpdates: boolean,
  emailNotifications: boolean,
  browserNotifications: boolean,
  notificationSound: boolean
};
```

#### **5. Preference Storage Strategy**

**User preferences stored separately from infrastructure config:**

```javascript
// === PREFERENCE STORAGE PATTERNS ===

// Browser storage for UI preferences
const uiPreferences = {
  storage: 'localStorage',
  key: 'adobe-app-builder-ui-preferences',
  encryption: false // UI preferences not sensitive
};

// User profile storage for export preferences  
const exportPreferences = {
  storage: 'userProfile',
  key: 'export-preferences',
  encryption: false // Export preferences not sensitive
};

// Secure storage for notification preferences
const notificationPreferences = {
  storage: 'secureUserProfile', 
  key: 'notification-preferences',
  encryption: true // May contain email/contact info
};
```

#### **6. Feature Toggle Architecture**

**Application settings and feature toggles follow domain organization:**

```javascript
// === APPLICATION FEATURE TOGGLES ===

config/features/
├── product-features.js        # Product domain feature toggles
├── file-features.js           # File domain feature toggles
├── commerce-features.js       # Commerce domain feature toggles
└── shared/
    ├── feature-detection.js   # Cross-domain feature detection
    └── feature-validation.js  # Cross-domain feature validation

// === FEATURE USAGE IN WORKFLOWS ===
async function exportProducts(params, config) {
  const { features } = config;
  
  // Check feature availability before using
  if (features.products.meshExport.enabled) {
    return await exportViaApiMesh(params, config);
  }
  
  if (features.products.bulkExport.enabled && params.bulkMode) {
    return await exportInBulk(params, config);
  }
  
  // Default export method
  return await exportViaRestApi(params, config);
}
```

#### **7. Configuration Validation for Preferences**

**User preferences validated with same rigor as infrastructure config:**

```javascript
// === PREFERENCE VALIDATION SCHEMA ===

// config/schema/user-preferences.schema.js
const userPreferencesSchema = {
  ui: {
    theme: { type: 'string', enum: ['dark', 'light', 'auto'], default: 'auto' },
    language: { type: 'string', enum: ['en', 'es', 'fr'], default: 'en' },
    itemsPerPage: { type: 'number', enum: [25, 50, 100], default: 50 }
  },
  export: {
    defaultFormat: { type: 'string', enum: ['csv', 'xlsx', 'json'], default: 'csv' },
    fields: { type: 'array', items: { type: 'string' }, default: ['sku', 'name'] },
    includeImages: { type: 'boolean', default: false }
  },
  notifications: {
    exportComplete: { type: 'boolean', default: true },
    errorAlerts: { type: 'boolean', default: true },
    emailNotifications: { type: 'boolean', default: false }
  }
};

// === PREFERENCE VALIDATION INTEGRATION ===
function validateUserPreferences(preferences, schema) {
  return validateAgainstSchema(preferences, schema, {
    allowDefaults: true,
    strict: false, // User preferences more flexible than infrastructure
    sanitize: true // Clean user input
  });
}
```

#### **8. Frontend Configuration Generation for Preferences**

**User preferences included in frontend configuration build:**

```javascript
// === FRONTEND CONFIGURATION WITH PREFERENCES ===

// scripts/build/operations/config-generation.js
function generateFrontendConfig(environment, userPreferences = {}) {
  const infraConfig = loadConfig({}, environment === 'production');
  
  return {
    // Infrastructure (public only)
    runtime: {
      url: infraConfig.runtime.url,
      namespace: infraConfig.runtime.namespace
    },
    
    // User preferences (all client-side safe)
    userPreferences: {
      ui: userPreferences.ui || getDefaultUiPreferences(),
      export: sanitizeExportPreferences(userPreferences.export),
      notifications: sanitizeNotificationPreferences(userPreferences.notifications)
    },
    
    // Feature toggles (public features only)
    features: {
      products: infraConfig.features.products.publicFeatures,
      files: infraConfig.features.files.publicFeatures
    }
  };
}
```

### **Configuration Architecture Benefits**

#### **Complete User Experience**

- ✅ **Infrastructure config** - System behavior and integrations
- ✅ **User preferences** - Personalized experience and workflows
- ✅ **Feature toggles** - Application capabilities and feature availability
- ✅ **Unified access** - Single config object contains all settings

#### **Feature-First Integration**

- ✅ **Domain organization** - Preferences organized by business domain
- ✅ **Feature cohesion** - Related preferences grouped with business features
- ✅ **Clean contracts** - Features receive complete config with preferences
- ✅ **Testing support** - Mock preferences for comprehensive feature testing

#### **Maintainable Architecture**

- ✅ **Separation of concerns** - Infrastructure vs user vs feature settings
- ✅ **Validation consistency** - Same schema validation approach for all config
- ✅ **Frontend integration** - Secure preference inclusion in generated frontend config
- ✅ **Storage strategy** - Appropriate storage for different preference types

---

## Scripts Architecture Standards

### CRITICAL: Scripts Follow Identical Standards to src/ and actions/

**Scripts use the exact same Feature-First DDD organization and code quality standards as the main application code.**

There is **no difference** in architectural approach between `scripts/`, `src/`, and `actions/` - all follow the same unified Feature-First DDD principles.

#### Unified Architecture Pattern

**All code in this repository follows these identical standards:**

1. **Feature-First Organization** - Complete business capabilities in single files
2. **Progressive Disclosure** - Business workflows → Feature operations → Feature utilities
3. **Domain-Driven Design** - Clear bounded contexts and domain separation
4. **Direct Imports** - No namespace imports, explicit dependencies
5. **ESLint Compliance** - Max 5 parameters, complexity ≤10, no unused variables
6. **Configuration Over Constants** - Use config values, not hardcoded fallbacks
7. **Step Comments in Workflows** - "Step 1:", "Step 2:" for business processes
8. **Strategic Duplication** - Better than complex abstractions

#### Scripts Feature-First Pattern

**Scripts follow the exact same structure as src/ features:**

```javascript
// scripts/app-deploy.js

/**
 * App Deploy - Complete deployment capability
 * Complete application deployment with all supporting functions
 */

// All dependencies at top - external vs internal is obvious from paths
const { executeScriptWithExit } = require('./shared/script-framework');
const { loadConfig } = require('../config');

// Business Workflows
async function deployApp(options) {
  // Step 1: Environment setup
  const environment = detectEnvironment(options);
  
  // Step 2: Build and deploy
  const buildResult = await executeBuildProcess(environment);
  const deployResult = await executeAppDeployment(buildResult);
  
  return deployResult;
}

// Feature Operations
async function executeBuildProcess(environment) {
  // Build coordination logic
}

async function executeAppDeployment(buildResult) {
  // App deployment coordination logic  
}

// Feature Utilities
function detectEnvironment(options) {
  // Environment detection logic
}

// CLI Entry Point (Scripts-specific pattern)
if (require.main === module) {
  executeScriptWithExit('app-deploy', async () => {
    const args = parseArgs(process.argv.slice(2));
    return await deployApp(args);
  });
}

module.exports = { deployApp };
```

#### Scripts-Specific Additions

**The only difference is CLI integration:**

```javascript
// CLI Entry Point Integration (unique to scripts)
if (require.main === module) {
  executeScriptWithExit('script-name', async () => {
    const args = parseArgs(process.argv.slice(2));
    return await mainFunction(args);
  });
}
```

#### Operational Domain Organization

**Scripts organize by operational capabilities (same as src/ domain organization):**

```text
scripts/
├── app-deploy.js              # Complete deployment capability
├── app-test.js                # Complete testing capability  
├── app-monitor.js             # Complete monitoring capability
├── app-build.js               # Complete build capability
├── app-audit.js               # Complete audit capability
├── app-audit-test.js          # Complete audit testing capability
├── app-audit/                 # Feature sub-modules (when >400 lines)
│   ├── tier1-audits.js        # Tier 1 audit utilities
│   ├── tier2-audits.js        # Tier 2 audit utilities
│   ├── tier3-audits.js        # Tier 3 audit utilities
│   └── report-generation.js   # Report generation utilities
├── app-audit-test/            # Feature sub-modules (when >400 lines)
│   ├── test-case-generation.js # Test case utilities
│   ├── audit-validation.js   # Validation utilities
│   ├── confidence-scoring.js # Confidence utilities
│   └── suite-execution.js    # Execution utilities
└── shared/                    # Cross-script infrastructure utilities
    ├── script-framework.js    # Script execution framework
    ├── formatting.js          # Output formatting utilities
    └── args.js                # CLI argument parsing
```

### Scripts Compliance Checklist

**Scripts must meet ALL the same standards as src/ and actions/:**

- [ ] **Feature-First organization** - Complete capabilities in single files
- [ ] **Progressive disclosure** - Business workflows → operations → utilities
- [ ] **ESLint compliance** - Max 5 parameters, complexity ≤10, no unused variables
- [ ] **Configuration over constants** - Use config values, not hardcoded fallbacks
- [ ] **Step comments in workflows** - Convert regular comments to step comments for business processes
- [ ] **Direct imports** - No namespace imports, explicit dependencies
- [ ] **Function organization** - Most comprehensive functions FIRST within each section
- [ ] **Export organization** - ≤5 exports = no comments; 6+ exports = use export comments
- [ ] **CLI integration pattern** - Consistent entry point pattern across all scripts
- [ ] **Domain-appropriate JSDoc** - Clear contracts and usage examples
- [ ] **Pure functions** - Clear input/output contracts
- [ ] **Single responsibility** - Each function does one thing well

### Unified Development Benefits

**Same benefits across scripts/, src/, and actions/:**

- ✅ **Cognitive Consistency** - Same mental model for all code contexts
- ✅ **Complete Feature Understanding** - No file jumping required for any capability
- ✅ **Predictable Structure** - Same organization patterns everywhere
- ✅ **Easy Maintenance** - Same patterns for debugging and modification
- ✅ **Quality Assurance** - Same ESLint rules and architectural compliance
- ✅ **Clear Ownership** - Same responsibility boundaries

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
}, config, params); // No trace parameter
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

### Code Quality Standards

**CRITICAL: ESLint Compliance (NEW)**

All functions must pass ESLint validation without warnings:

```javascript
// ✅ CORRECT: ESLint compliant function
async function executeRequest(url, options, config, params) { // ≤5 parameters
  if (!url) throw new Error('URL required'); // Simple complexity
  return await makeRequest(url, options, config, params);
}

// ❌ WRONG: ESLint violations
async function executeRequest(url, options, config, params, trace, ttl) { // >5 parameters
  // Complex nested logic with high cyclomatic complexity
}
```

**ESLint Requirements:**

- **max-params**: ≤5 parameters per function
- **complexity**: ≤10 cyclomatic complexity
- **no-unused-vars**: All imports and variables must be used

**Parameter Consolidation Strategies:**

```javascript
// ✅ CORRECT: Consolidate related parameters into options object
async function executeRequest(url, requestOptions, config, params) {
  const { ttl = 300, method = 'GET', ...options } = requestOptions;
}

// ❌ WRONG: Too many individual parameters
async function executeRequest(url, method, ttl, options, config, params) {
}
```

### Monitoring and Observability Standards

**CRITICAL: No Over-Architected Monitoring (NEW)**

Trace and monitoring parameters have been removed as over-engineering:

```javascript
// ✅ CORRECT: Clean function signatures without trace
async function executeRequest(url, options, config, params) {
  return await makeRequest(url, options, config, params);
}

// ❌ WRONG: Over-architected monitoring parameters
async function executeRequest(url, options, config, params, trace = null) {
  if (trace?.incrementApiCalls) trace.incrementApiCalls(); // Over-engineering
}
```

**Monitoring Policy:**

- **No trace parameters** - Remove from all function signatures
- **No monitoring injection** - Monitoring should be infrastructure concern, not business logic
- **Simple logging** - Use console.warn/error for important events only
- **Performance focus** - Optimize for actual business needs, not theoretical monitoring

### Step Comments Standards (REFINED)

**CRITICAL: Workflow Step Comments vs Regular Comments**

Convert meaningful regular comments to step comments in business workflows:

```javascript
// ✅ CORRECT: Step comments in workflows
async function processExport(data, config) {
  // Step 1: Validate input parameters
  validateExportData(data, config);
  
  // Step 2: Transform data for export
  const transformed = await transformData(data, config);
  
  // Step 3: Generate and store file
  return await storeExportFile(transformed, config);
}

// ✅ CORRECT: Regular comments for implementation details
function buildApiUrl(baseUrl, endpoint) {
  // Handle both absolute and relative URLs
  return endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
}

// ❌ WRONG: Regular comments for workflow steps
async function processExport(data, config) {
  // Validate input parameters
  validateExportData(data, config);
  
  // Transform data for export
  const transformed = await transformData(data, config);
}
```

**Step Comment Rules:**

- **Use in workflows**: Functions that orchestrate multiple operations
- **Sequential operations**: When there are multiple logical steps
- **Business processes**: User-facing capabilities with clear phases
- **Don't use for**: Single operations, utilities, implementation details

### Configuration Over Constants (NEW)

**CRITICAL: Use Configuration Instead of Hardcoded Constants**

Always use configuration values instead of hardcoded constants:

```javascript
// ✅ CORRECT: Use configuration values
async function buildProducts(products, config) {
  const exportFields = config.main.exportFields; // From configuration
  const categoryMap = config.categoryMap || {};
  
  return products.map(product => 
    buildProductObject(product, categoryMap, config)
  );
}

// ❌ WRONG: Hardcoded constants
const DEFAULT_PRODUCT_FIELDS = ['sku', 'name', 'price']; // Should be in config

async function buildProducts(products, config = {}) {
  const exportFields = config.main?.exportFields || DEFAULT_PRODUCT_FIELDS; // Fallback pattern
}
```

**Configuration Requirements:**

- **Required config parameter** - Don't make configuration optional
- **No fallback constants** - Force proper dependency injection
- **Validation** - Ensure required configuration is provided
- **Error messages** - Clear errors when configuration is missing

**Configuration Validation Pattern:**

```javascript
function validateRequiredConfig(config, requiredPath) {
  if (!config || !config.main || !config.main.exportFields) {
    throw new Error(`Configuration with ${requiredPath} is required`);
  }
}
```

---

## Compliance Checklist

### Universal Feature-First Standards

**CRITICAL: These standards apply to ALL code - `src/`, `actions/`, `scripts/`, and `shared/`**

- [ ] **Feature-First organization** - Complete business capabilities in single files or sub-modules
- [ ] **Progressive disclosure** - Business workflows → Feature operations → Feature utilities
- [ ] **Domain boundaries respected** - Clear separation between domains and infrastructure
- [ ] **Direct imports** - No namespace imports, explicit dependencies
- [ ] **ESLint compliance** - Max 5 parameters, complexity ≤10, no unused variables
- [ ] **Configuration over constants** - Use config values, not hardcoded fallbacks
- [ ] **Step comments in workflows** - "Step 1:", "Step 2:" for business processes only
- [ ] **Export organization** - ≤5 exports = no comments; 6+ exports = use export comments
- [ ] **Function organization** - Most comprehensive functions FIRST within each section
- [ ] **JSDoc documentation** - @purpose, @usedBy, clear contracts for all functions

### Domain-Specific Standards

#### Action Standards (actions/)

- [ ] Uses `createAction()` framework
- [ ] Clean orchestrator pattern (50-80 lines)
- [ ] Import organization: All dependencies at top of file - grouping is obvious from paths
- [ ] Step comments only for multiple logical steps (no "Step 1:" for single operations)
- [ ] Step-based workflow with `formatStepMessage()` when appropriate
- [ ] No custom error handling
- [ ] Consistent response structure

#### Primary Domain Standards (src/products/, src/files/, src/commerce/, src/htmx/, src/testing/)

- [ ] **Complete feature files** - Business workflows + operations + utilities in single files
- [ ] **Sub-modules when needed** - For files >400 lines, organize into feature/sub-modules/
- [ ] **Domain shared/** - Only truly shared utilities used by 3+ features within domain
- [ ] **Cross-domain imports** - Only from other domain interfaces and shared infrastructure
- [ ] **Feature cohesion** - Related business logic concentrated in appropriate features

#### Infrastructure Standards (src/shared/)

- [ ] **Cross-domain utilities only** - NOT business domains (action framework, HTTP, validation, utils)
- [ ] **Universal applicability** - Used by multiple primary domains
- [ ] **Technical focus** - Infrastructure concerns, not business logic
- [ ] **Flat organization** - Simple directory structure appropriate to complexity

#### Scripts Standards (scripts/)

- [ ] **Operational capabilities** - Complete deployment, monitoring, auditing workflows
- [ ] **CLI integration pattern** - Consistent entry points and argument parsing
- [ ] **Feature-First organization** - Same patterns as src/ domains
- [ ] **Shared infrastructure** - Common CLI utilities in `scripts/shared/`

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
- [ ] **Required configuration validation** - Validate config presence, don't use fallbacks
- [ ] **No hardcoded constants** - All defaults come from configuration files

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

// All dependencies at top - core and domain layers clear from paths
const { response } = require('../../shared/http/responses'); // Core layer
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

### Adobe I/O Runtime Actions (`actions/`)

**CRITICAL: Actions represent business capabilities and must align with Feature-First DDD principles.**

Actions are the **entry points** for Adobe App Builder applications and serve as the **application layer** in DDD architecture. Each action orchestrates domain workflows to fulfill specific business use cases.

```text
actions/
├── get-products/              # Product export business capability
│   └── index.js              # REST API product export action (uses products/rest-export.js)
├── get-products-mesh/         # Product export business capability (alternative implementation)
│   └── index.js              # API Mesh product export action (uses products/mesh-export.js)
├── browse-files/              # File management business capability
│   └── index.js              # File browsing action (uses files/file-browser.js)
├── download-file/             # File management business capability
│   └── index.js              # File download action (uses files/file-download.js)
└── delete-file/               # File management business capability
    └── index.js              # File deletion action (uses files/file-deletion.js)
```

#### Action Organization Principles

**1. Business Capability Alignment**

- Each action represents a **complete business use case**
- Action names reflect **user intent**, not technical implementation
- Actions **orchestrate domain workflows**, not implement business logic directly

**2. Domain Integration Pattern**

- Actions **import and use domain workflows** from `src/`
- Actions **do not contain business logic** - they delegate to domain features
- Actions serve as **thin orchestration layer** between HTTP requests and domain logic

**3. createAction() Framework (MANDATORY)**
All actions must use the unified action framework:

```javascript
// actions/get-products/index.js

/**
 * Product Export Action
 * Business capability: Export product data as CSV with multiple implementation options
 */

// All dependencies at top - framework and domain imports clear from paths
const { createAction } = require('../../src/shared/action/action-factory');
const { exportProducts } = require('../../src/products/rest-export');

// === ACTION BUSINESS LOGIC ===
async function productExportBusinessLogic(context) {
  const { config, extractedParams } = context;
  
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

#### Action to Domain Mapping

**Product Domain Actions:**

- `get-products/` → `src/products/rest-export.js`
- `get-products-mesh/` → `src/products/mesh-export.js`

**File Domain Actions:**

- `browse-files/` → `src/files/file-browser.js`
- `download-file/` → `src/files/file-download.js`  
- `delete-file/` → `src/files/file-deletion.js`

#### Action Architecture Rules

**✅ CORRECT Action Patterns:**

```javascript
// Thin orchestration - delegates to domain
async function actionLogic(context) {
  const result = await domainWorkflow(context.extractedParams, context.config);
  return formatActionResponse(result);
}

// Uses createAction framework
module.exports = createAction(actionLogic, { actionName: 'action-name' });

// Clear business capability naming
// get-products, browse-files, download-file
```

**❌ WRONG Action Patterns:**

```javascript
// Fat actions with business logic
async function main(params) {
  const products = await fetch('/api/products'); // Business logic in action
  const csv = products.map(p => transform(p));    // Transformation in action
  return storeFile(csv);                          // Storage logic in action
}

// Legacy main export pattern
module.exports = { main };

// Technical naming
// fetch-data, process-files, store-results
```

#### Action File Structure Standards

**Each action file must follow this exact pattern:**

```javascript
/**
 * [Business Capability] Action
 * Business capability: [Clear description of what business use case this serves]
 */

const { createAction } = require('../../src/shared/action/action-factory');
const { domainWorkflow } = require('../../src/domain/feature-file');

async function actionBusinessLogic(context) {
  // Step comments only when there are genuinely multiple logical steps
  // Single operations don't need "Step 1:" comments
  
  return {
    message: 'Success message',
    steps: [...],
    ...domainResult
  };
}

module.exports = createAction(actionBusinessLogic, {
  actionName: 'action-directory-name',
  description: 'Business capability description'
});
```

#### Action Integration with app.config.yaml

Actions must be properly configured in `app.config.yaml`:

```yaml
# Each action represents a business capability
get-products:
  function: actions/get-products/index.js
  web: 'yes'
  runtime: nodejs:18
  inputs:
    # Domain-specific configuration
    COMMERCE_CONSUMER_KEY: $COMMERCE_CONSUMER_KEY
    # ... other required inputs

get-products-mesh:
  function: actions/get-products-mesh/index.js
  web: 'yes'  
  runtime: nodejs:18
  # Same inputs as get-products (same business capability, different implementation)
```

#### Action Naming Conventions

**Business Capability Based Naming:**

- ✅ `get-products` - Clear business intent
- ✅ `browse-files` - User-focused action
- ✅ `download-file` - Specific business operation

**Avoid Technical Implementation Naming:**

- ❌ `rest-api-fetch` - Implementation detail
- ❌ `mesh-graphql-query` - Technical approach  
- ❌ `csv-processor` - Technical function

#### Action Error Handling

Actions use the framework's built-in error handling:

```javascript
// Framework handles all error scenarios automatically
async function actionLogic(context) {
  // Business logic that may throw errors
  const result = await domainWorkflow(params, config);
  
  // Framework converts errors to proper HTTP responses
  return result;
}

// No manual try/catch blocks needed
// No custom error response building required
```

#### Action Code Style Rules

**Import Organization:**

```javascript
// ✅ CORRECT: Clean imports (grouping is obvious from paths)
const { createAction } = require('../../src/shared/action/action-factory');
const { deleteFileWithValidation } = require('../../src/files/file-deletion');
const { generateDeleteConfirmationModal } = require('../../src/htmx/modal-interactions');

// ✅ CORRECT: More imports (still no section comments needed)
const { createAction } = require('../../src/shared/action/action-factory');
const { response } = require('../../src/shared/http/responses');
const { deleteFileWithValidation } = require('../../src/files/file-deletion');
const { generateDeleteConfirmationModal } = require('../../src/htmx/modal-interactions');
const { generateCompleteFileBrowserUI } = require('../../src/htmx/file-browser-ui');
const { storeCsvFile } = require('../files/csv-export');
```

**Step Comments:**

```javascript
// ✅ CORRECT: Multiple meaningful steps - Use step comments
async function deleteFileBusinessLogic(context) {
  const { config, extractedParams } = context;

  // Step 1: Check if this is a confirmation request or file browser refresh
  if (!extractedParams.fileName) {
    return await generateCompleteFileBrowserUI(config, extractedParams);
  }

  // Step 2: Generate delete confirmation modal 
  if (!extractedParams.confirmed) {
    return await generateDeleteConfirmationModal(extractedParams.fileName, config, extractedParams);
  }

  // Step 3: Execute validated file deletion
  const deletionResult = await deleteFileWithValidation(
    extractedParams.fileName,
    config,
    extractedParams
  );

  return deletionResult;
}

// ✅ CORRECT: Single operation - No step comment needed
async function browseFilesBusinessLogic(context) {
  const { config, extractedParams } = context;

  return await generateCompleteFileBrowserUI(config, extractedParams);
}
```

---

This comprehensive architecture provides a **complete foundation** for Feature-First DDD development in Adobe App Builder applications, successfully balancing:

- ✅ **Domain-Driven Design** - Proper bounded contexts and domain separation
- ✅ **Feature-First Organization** - Complete business capabilities in single files  
- ✅ **Cognitive Efficiency** - Progressive disclosure and no file jumping required
- ✅ **Clean Configuration** - Dependency injection with trusted configuration patterns
- ✅ **Three-Tiered Sharing** - Strategic code reuse without over-abstraction
- ✅ **Action Framework Integration** - Consistent thin orchestration layer
- ✅ **Adobe I/O Runtime Compliance** - Platform-specific patterns and best practices
- ✅ **Comprehensive Documentation** - Complete contracts and usage examples

## Safe Architectural Transformation Patterns

### CRITICAL: Zero-Downtime Transformation Strategy

**When refactoring from layer-first to Feature-First architecture, always use the "Consolidate THEN Remove" pattern to prevent broken intermediate states.**

#### **The Consolidate-Then-Remove Pattern**

**RULE: Never remove existing working structure until new structure is validated and all imports are switched.**

```javascript
// === PHASE 1: CONSOLIDATE (Build alongside existing) ===

src/products/
├── workflows/             # KEEP - existing working structure
├── operations/            # KEEP - existing working structure  
├── utils/                 # KEEP - existing working structure
├── rest-export.js         # NEW - consolidate functions from workflows/operations/utils
├── mesh-export.js         # NEW - consolidate functions from workflows/operations/utils
└── shared/                # NEW - extract truly shared utilities

// === PHASE 2: VALIDATE NEW STRUCTURE ===
// Test new files in isolation
// Verify imports work correctly
// Confirm functionality is preserved

// === PHASE 3: ATOMIC SWITCH ===
// Update ALL imports simultaneously in one commit
// Deploy and test complete system
// Verify all actions work with new architecture

// === PHASE 4: REMOVE OLD STRUCTURE ===
// Only after confirming new system works completely
rm -rf src/products/workflows/
rm -rf src/products/operations/  
rm -rf src/products/utils/
```

#### **Why This Pattern is Critical**

**❌ WRONG: Remove-Then-Build Approach**

```bash
# This creates broken intermediate states
rm -rf src/products/operations/  # BREAKS existing imports
rm -rf src/products/utils/       # BREAKS existing imports
# Now build new files... (system is broken during this phase)
```

**✅ CORRECT: Consolidate-Then-Remove Approach**

```bash
# Build new structure alongside existing
# Validate new structure works
# Switch imports atomically  
# Remove old structure only after validation
```

#### **Architectural Transformation Safety Rules**

**1. Parallel Development Phase**

- Build new feature files alongside existing structure
- Never modify existing working files during consolidation phase
- Test new files in isolation before integration

**2. Atomic Integration Phase**  

- Update ALL imports simultaneously in single commit
- Deploy to staging/production environment
- Test ALL actions and workflows with new architecture
- Verify complete system functionality

**3. Validation Phase**

- Verify all actions work with new architecture
- Confirm no broken imports or missing dependencies
- Test complete system functionality before cleanup

**4. Cleanup Phase**

- Remove old directories only after confirming new system works
- Document what was moved where for future reference
- Update audit baselines to reflect new structure

#### **Implementation Template**

```javascript
/**
 * Safe Architectural Transformation Checklist
 * Use this pattern for any layer-first to Feature-First migration
 */

// === STEP 1: CONSOLIDATE (Parallel Development) ===
// 1. Build new feature files alongside existing structure
// 2. Consolidate functions from operations/utils into feature files  
// 3. Test new files in isolation (syntax, linting, basic functionality)
// 4. Verify no circular dependencies in new structure

// === STEP 2: VALIDATE (Atomic Integration) ===
// 1. Update ALL imports to use new feature files (single commit)
// 2. Deploy to staging/production environment
// 3. Test ALL actions and workflows with new architecture
// 4. Verify complete system functionality

// === STEP 3: CLEANUP (Safe Removal) ===
// 1. Confirm new system works completely
// 2. Remove old layer-first directories (rm -rf operations/ utils/ workflows/)
// 3. Update documentation and audit baselines
// 4. Final validation that nothing is broken

// === STEP 4: AUDIT COMPLIANCE ===
// 1. Run architecture audit to confirm compliance
// 2. Verify no broken imports remain
// 3. Update progress tracking and metrics
// 4. Document transformation for future reference
```

#### **Common Transformation Antipatterns**

**❌ ANTIPATTERN: Incremental File-by-File Migration**

```bash
# Don't do this - creates inconsistent intermediate states
mv src/products/operations/validation.js src/products/rest-export.js # Partial migration
# Some imports still point to operations/, others to rest-export.js
# System is in inconsistent state
```

**❌ ANTIPATTERN: Remove Before Validate**

```bash
# Don't do this - creates broken deployment windows
rm -rf src/products/operations/  # System breaks
# Then try to fix imports... (deployment is broken)
```

**❌ ANTIPATTERN: Mixed Architecture States**

```bash
# Don't do this - creates cognitive overhead
src/products/
├── rest-export.js         # Feature-First file
├── operations/            # Layer-first directory  
│   └── validation.js      # Some functions moved, others not
└── utils/                 # Layer-first directory
    └── formatting.js      # Mixed state - hard to understand
```

**✅ CORRECT PATTERN: Complete Domain Transformation**

```bash
# Do this - clear before/after states
src/products/
├── rest-export.js         # Complete feature with all related functions
├── mesh-export.js         # Complete feature with all related functions  
├── product-enrichment.js  # Complete feature with all related functions
└── shared/                # Only truly shared utilities (3+ feature usage)
```

#### **Transformation Validation Commands**

```bash
# === PHASE 1: CONSOLIDATION VALIDATION ===
# Verify new files exist and have no syntax errors
node -e "require('./src/products/rest-export.js')"
npm run lint src/products/rest-export.js

# === PHASE 2: INTEGRATION VALIDATION ===
# Deploy and test complete system
npm run deploy
npm run test:action get-products
npm run test:action get-products-mesh

# === PHASE 3: CLEANUP VALIDATION ===  
# Verify old structure is completely removed
find src/ -name "workflows" -o -name "operations" -o -name "utils" -type d

# === PHASE 4: AUDIT VALIDATION ===
# Confirm architectural compliance
npm run audit | grep "feature-first-file-organization"
npm run audit | grep "function-organization-within-files"
```

#### **Benefits of Safe Transformation Pattern**

**Development Benefits:**

- ✅ **Zero downtime** - System never breaks during transformation
- ✅ **Rollback safety** - Can return to working state at any point
- ✅ **Clear progress** - Obvious before/during/after states
- ✅ **Validation points** - Multiple verification opportunities

**Operational Benefits:**

- ✅ **Production safety** - No broken deployments
- ✅ **Team coordination** - Clear transformation phases
- ✅ **Audit compliance** - Measurable progress tracking
- ✅ **Documentation trail** - Clear record of what moved where

**Architecture Benefits:**

- ✅ **Complete features** - All related functions consolidated together
- ✅ **Clear boundaries** - Domain separation maintained
- ✅ **Progressive disclosure** - Functions organized by complexity
- ✅ **Strategic sharing** - Only true cross-feature utilities shared

---

## Conclusion

This comprehensive architecture provides a **complete foundation** for Feature-First DDD development in Adobe App Builder applications, successfully balancing:

- ✅ **Domain-Driven Design** - Proper bounded contexts and domain separation
- ✅ **Feature-First Organization** - Complete business capabilities in single files
- ✅ **Cognitive Efficiency** - Progressive disclosure and no file jumping required
- ✅ **Clean Configuration** - Dependency injection with trusted configuration patterns
- ✅ **Three-Tiered Sharing** - Strategic code reuse without over-abstraction
- ✅ **Action Framework Integration** - Consistent thin orchestration layer
- ✅ **Adobe I/O Runtime Compliance** - Platform-specific patterns and best practices
- ✅ **Comprehensive Documentation** - Complete contracts and usage examples

### **Architecture Validation**

The architecture has been validated through:

- **Successful Implementation** - 5 production actions using createAction() framework
- **Comprehensive Audit System** - 100% accurate validation rules for architectural compliance
- **Real-World Deployment** - Adobe I/O Runtime staging and production environments
- **Performance Testing** - Consistent performance patterns across REST and API Mesh implementations

### **Development Benefits**

**Code Quality:**

- Zero duplication across actions (216 lines eliminated)
- Consistent patterns (100% compliance via audit system)
- Average action size: 46 lines (down from 123 lines)
- Boilerplate eliminated: 15-25 lines per action
**Developer Experience:**
- Predictable structure in every file
- Self-documenting business logic flows
- Easy maintenance through consistent patterns
- Fast development with framework templates
**Architecture Quality:**
- Direct import clarity - Dependencies immediately obvious
- Feature-First DDD organization - Complete capabilities with domain boundaries
- Strategic duplication - Better maintainability than complex abstractions
- Configuration integration - Clean dependency injection patterns
All principles support rapid, consistent development while maintaining high code quality and clear architectural boundaries suitable for enterprise Adobe Commerce integration applications.
