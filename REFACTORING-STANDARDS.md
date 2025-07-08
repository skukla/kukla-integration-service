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

## Function Standards

### Length Guidelines

- **Target**: 10-40 lines for most functions
- **Acceptable**: Up to 60 lines if genuinely single responsibility
- **Split Required**: When function handles multiple distinct concerns

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

### Single Responsibility Rule

- Each function should do ONE thing well
- Function name should clearly indicate its purpose
- **Test**: Can you explain what this function does in one sentence?

**✅ Good Example:**

```javascript
function fetchProductsFromCommerce(credentials, pageSize) {
  // Only fetches products, nothing else
}

function enrichProductsWithCategories(products, categories) {
  // Only adds category data, nothing else
}
```

**❌ Bad Example:**

```javascript
function fetchAndEnrichProducts(params) {
  // Fetches products AND enriches them AND validates them
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

### Error Handling Consistency

- Use same error handling pattern throughout application
- Consistent error types and structure
- **Test**: Does this error handling match the pattern used elsewhere?

## Code Organization Standards

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

- Group imports logically (core, commerce, utilities)
- Use clear, descriptive import names
- **Test**: Are imports organized and easy to understand?

### File Structure

- Keep related functions together
- Use descriptive file names
- **Test**: Would a new developer know where to find this function?

## Testing Standards

### Deployment Reality

- **CRITICAL**: Most changes require `npm run deploy` to properly test
- **Deployment takes time** - make changes small enough to test efficiently
- **Test failures are expensive** - broken functionality might not be caught until after deployment
- **Rollback planning** - ensure changes are easily reversible

### Functionality Preservation

- **CRITICAL**: No existing functionality can be broken
- All refactored functions must maintain exact same behavior
- **Test**: Does `npm run test:action get-products` still work after deployment?

### Incremental Changes

- Make one logical change at a time
- Deploy and test after each change
- **Test**: Can you describe exactly what this change does?
- **Size limit**: Changes should be small enough to test and rollback quickly

### Testing Workflow

1. **Make small, focused change**
2. **Deploy**: `npm run deploy`
3. **Test**: `npm run test:action get-products` (and other affected actions)
4. **Verify**: Check that functionality is preserved
5. **Commit**: Only commit if tests pass
6. **Rollback**: If tests fail, revert immediately

### Pre-Deployment Checklist

Before deploying any change:

- [ ] Change is small and focused (single logical improvement)
- [ ] I can easily explain what changed and why
- [ ] I have a rollback plan if this breaks
- [ ] I know exactly which actions to test after deployment
- [ ] I've checked for syntax errors and obvious issues locally

## Refactoring Decision Rubric

Before making ANY change, answer these questions:

### 1. **Is this change necessary?**

- [ ] Does the current code have a genuine problem?
- [ ] Will this change make the code significantly easier to work with?
- [ ] Or am I just changing it because it's different from my preferred style?

### 2. **Does this change improve clarity?**

- [ ] Will someone unfamiliar with this code understand it faster?
- [ ] Are the function's responsibilities clearer?
- [ ] Are the parameters and return values more obvious?

### 3. **Is this change consistent?**

- [ ] Could this same pattern be applied to similar functions?
- [ ] Does this match the established patterns in the codebase?
- [ ] Am I creating a one-off solution?
- [ ] Have I checked if this functionality already exists?
- [ ] If similar functionality exists, am I consolidating rather than duplicating?

### 4. **Is this change practical?**

- [ ] Does this solve a real problem developers face?
- [ ] Will this make future modifications easier?
- [ ] Or am I just following a theoretical principle?

### 5. **Is this change safe?**

- [ ] Have I tested that functionality is preserved?
- [ ] Are the changes small enough to easily review?
- [ ] Can I easily revert if there's a problem?
- [ ] Is this change small enough to test efficiently with deployment?
- [ ] Do I have a clear plan for testing this change?

### 6. **Does this follow functional composition principles?**

- [ ] Is this function pure (same inputs = same outputs, no side effects)?
- [ ] Does this function compose well with other functions?
- [ ] Am I avoiding class hierarchies and inheritance?
- [ ] Are the input/output contracts clear?

### 7. **Does this improve discoverability?**

- [ ] Will developers find this function quickly using the catalog pattern?
- [ ] Is this organized by domain (products, files, commerce, shared)?
- [ ] Does this reduce the time to find existing functionality?
- [ ] Is the purpose obvious from the location and name?

## Approval Criteria

**Every change must score YES on ALL questions:**

1. **Clarity**: Is the code easier to understand?
2. **Necessity**: Is this change solving a real problem?
3. **Consistency**: Does this follow established patterns?
4. **Safety**: Is functionality preserved?
5. **Practicality**: Will this make future work easier?
6. **Uniqueness**: Does this avoid creating duplicate ways to do the same thing?
7. **Functional**: Does this follow functional composition principles?
8. **Discoverable**: Does this improve discoverability and organization?

**If ANY answer is NO, the change should not be made.**

## Functional Composition & Discoverability Architecture

### Catalog Pattern Standards

**All functionality must be organized in a discoverable catalog structure:**

```javascript
// src/index.js - Single entry point for all functionality
module.exports = {
  products: require('./products'),    // Product operations
  files: require('./files'),          // File operations  
  commerce: require('./commerce'),     // Commerce integration
  shared: require('./shared'),         // Truly shared utilities
};

// Domain index pattern - each domain exports its functions
// src/products/index.js
module.exports = {
  fetchProducts: require('./fetch').fetchProducts,
  enrichWithCategories: require('./fetch').enrichWithCategories,
  buildProductCsv: require('./transform').buildProductCsv,
  validateProductData: require('./validate').validateProductData,
};
```

### Domain Organization

**Functions must be organized by domain, not by technical layer:**

**✅ Good Domain Organization:**

```text
src/
├── products/        # Everything product-related
│   ├── fetch.js    # fetchProducts(), enrichWithCategories()
│   ├── transform.js # buildProductCsv(), formatProductData()
│   └── validate.js # validateProductData()
├── files/          # Everything file-related
│   ├── storage.js  # storeFile(), deleteFile()
│   └── browser.js  # listFiles(), generateBrowserHtml()
```

**❌ Bad Technical Layer Organization:**

```text
src/
├── controllers/    # All controllers together
├── services/       # All services together  
├── repositories/   # All repositories together
└── utils/          # All utilities together
```

### Functional Composition Standards

**All functions should follow pure functional principles:**

**✅ Pure Function Example:**

```javascript
// Clear input/output contract, no side effects
function enrichWithCategories(products, categoryData) {
  return products.map(product => ({
    ...product,
    categories: categoryData.filter(cat => 
      product.category_ids.includes(cat.id)
    )
  }));
}
```

**❌ Impure Function Example:**

```javascript
// Hidden dependencies, side effects
function enrichWithCategories(products) {
  // Depends on global state
  const categoryData = globalCategoryCache.get();
  
  // Modifies input
  products.forEach(product => {
    product.categories = fetchCategoriesFromAPI(product.id);
  });
  
  return products;
}
```

### Action Controller Pattern

**Actions should be thin orchestrators that compose domain functions:**

**✅ Thin Action Controller:**

```javascript
// actions/get-products.js
const { products, files, shared } = require('../src');

async function main(params) {
  const config = shared.loadConfig(params);
  
  // Just orchestrate domain functions
  const productData = await products.fetchProducts(config);
  const enrichedData = await products.enrichWithCategories(productData, config);
  const csvData = products.buildProductCsv(enrichedData);
  const storageResult = await files.storeFile(csvData, config);
  
  return shared.createSuccessResponse(storageResult);
}
```

**❌ Fat Action Controller:**

```javascript
// Business logic mixed into action
async function main(params) {
  // Validation logic
  if (!params.commerceUrl) throw new Error('Missing URL');
  
  // API calls
  const response = await fetch(params.commerceUrl + '/products');
  
  // Data transformation
  const products = response.data.map(p => ({
    sku: p.sku,
    name: p.name.trim(),
    // ... 50 lines of transformation logic
  }));
  
  // File operations
  const csv = products.map(p => `${p.sku},${p.name}`).join('\n');
  // ... storage logic
}
```

## Domain Organization Standards

### Functional Composition Approach

**As domains grow, organize by functional responsibility rather than technical layers:**

```text
src/domain/
├── index.js                    (public catalog)
├── workflows/                  (high-level compositions)
│   ├── export-products.js      (complete business flows)
│   └── import-products.js      (orchestrate multiple operations)
├── operations/                 (mid-level business logic)
│   ├── enrichment.js          (domain-specific operations)
│   ├── transformation.js      (business rule implementations)
│   └── validation.js          (domain validation logic)
└── utils/                      (low-level pure functions)
    ├── category.js            (data transformation utilities)
    ├── image.js               (format/parse utilities)
    └── data.js                (computation utilities)
```

### Function Hierarchy Guidelines

**Split files when they exceed 300-400 lines, organizing by abstraction level:**

#### 1. **Workflows** (High-Level Orchestration)

```javascript
// src/products/workflows/export-products.js
async function exportProducts(params, config, trace = null) {
  // Orchestrates complete business process
  const products = await fetchAndEnrichProducts(params, config, trace);
  const built = await buildProducts(products, config);
  const csv = await createCsv(built);
  const storage = await storeCsvFile(csv, config, params);
  
  return { productCount: products.length, storage };
}
```

#### 2. **Operations** (Mid-Level Business Logic)

```javascript
// src/products/operations/enrichment.js
async function enrichWithCategories(products, config, params, trace = null) {
  // Specific domain operation
  const categoryIds = extractCategoryIds(products);
  const categoryMap = await fetchCategoryData(categoryIds, config, params, trace);
  return enrichProductsWithCategories(products, categoryMap);
}
```

#### 3. **Utils** (Low-Level Pure Functions)

```javascript
// src/products/utils/category.js
function extractCategoryIds(products) {
  // Pure data transformation
  return products.flatMap(p => p.categories?.map(c => c.id) || []);
}
```

### Domain Catalog Pattern

**Each domain must maintain a hierarchical catalog for discoverability:**

```javascript
// src/products/index.js
module.exports = {
  // High-level workflows (what users actually want to do)
  exportProducts: require('./workflows/export-products').exportProducts,
  importProducts: require('./workflows/import-products').importProducts,
  
  // Mid-level operations (how the domain works)
  fetchAndEnrichProducts: require('./operations/enrichment').fetchAndEnrichProducts,
  buildProducts: require('./operations/transformation').buildProducts,
  
  // Low-level utilities (implementation details)
  extractCategoryIds: require('./utils/category').extractCategoryIds,
  
  // Structured access for organized usage
  workflows: {
    export: require('./workflows/export-products'),
    import: require('./workflows/import-products'),
  },
  operations: {
    enrichment: require('./operations/enrichment'),
    transformation: require('./operations/transformation'),
    validation: require('./operations/validation'),
  },
  utils: {
    category: require('./utils/category'),
    image: require('./utils/image'),
    data: require('./utils/data'),
  },
};
```

### When to Split Domain Files

**Split when:**

- File exceeds 300-400 lines
- Contains functions at very different abstraction levels
- Multiple developers working on same file
- Becoming difficult to navigate or understand

**Keep together when:**

- Functions are tightly coupled and share significant state
- Total file size is manageable (< 300 lines)
- Functions are at similar abstraction levels
- Split would create more complexity than it solves

### Migration Strategy

**Phase 1: Identify Large Files**

```bash
# Find files that need splitting
find src/ -name "*.js" -exec wc -l {} \; | sort -n | tail -10
```

**Phase 2: Analyze Function Abstraction Levels**

```javascript
// Example analysis for src/products/transform.js
// HIGH-LEVEL: buildProducts() - orchestrates transformation
// MID-LEVEL: buildProductObject() - business logic
// LOW-LEVEL: transformImageEntry() - data utility

// Split plan:
// → workflows/build-products.js (buildProducts)
// → operations/transformation.js (buildProductObject)  
// → utils/image.js (transformImageEntry)
```

**Phase 3: Split Gradually**

1. Create new directory structure
2. Move functions to appropriate levels
3. Update imports
4. Update domain catalog
5. Test that functionality is preserved

### Benefits of This Approach

**For Adobe App Builder:**

- **workflows/** perfect for action entry points
- **operations/** ideal for step functions
- **utils/** great for shared utilities

**For Commerce Integration:**

- Clear separation of API orchestration vs business logic
- Easier to find and modify specific Commerce operations
- Better testing boundaries (workflows end-to-end, operations isolated, utils pure)

**For Team Development:**

- Developers can work on different abstraction levels without conflicts
- Clear ownership boundaries (workflows = features, operations = domain logic, utils = shared)
- Easier code reviews (changes stay within appropriate abstraction level)

## Consistency & Anti-Spaghetti Standards

### Single Source of Truth Rule

- **Each concept should have ONE authoritative implementation**
- **Before creating new functionality, check if it already exists**
- **Consolidate duplicate implementations, don't add more**

### Pattern Consistency Checklist

Before implementing any solution, ask:

1. **Does this already exist?**
   - Search codebase for similar functionality
   - Check existing utilities and helpers
   - Look for patterns that solve the same problem

2. **Can I use the existing approach?**
   - Is there already a way to do this?
   - Can I extend the existing implementation?
   - Would using the existing pattern be clearer?

3. **If I must create something new:**
   - Can I replace the old implementation with the new one?
   - Can I merge the approaches into a single, better solution?
   - Document WHY this needs to be different

### Examples of What to Avoid

**❌ Multiple Ways to Do the Same Thing:**

```javascript
// File A
function formatFileSize(bytes) { /* implementation A */ }

// File B  
function getFileSizeDisplay(bytes) { /* implementation B */ }

// File C
function bytesToHuman(bytes) { /* implementation C */ }
```

**✅ Single, Consistent Implementation:**

```javascript
// src/core/utils/fileSize.js
function formatFileSize(bytes) { /* one implementation */ }

// Used everywhere consistently
const displaySize = formatFileSize(fileSizeInBytes);
```

**❌ Inconsistent Error Handling:**

```javascript
// Some places
throw new Error('Invalid input');

// Other places  
return { error: 'Invalid input' };

// Still other places
console.error('Invalid input'); return null;
```

**✅ Consistent Error Handling:**

```javascript
// Always use the same pattern
throw new Error('Invalid input: Please provide a valid product SKU');
```

### Implementation Standards

**Before adding ANY new function:**

1. **Search existing codebase** for similar functionality
2. **Check if existing utilities** can be extended
3. **Consider if this creates a new pattern** vs. using existing patterns
4. **Document the decision** if creating something new

**If you find duplicate implementations:**

1. **Consolidate immediately** - don't add a third way
2. **Choose the clearest implementation** as the standard
3. **Update all usages** to use the single implementation
4. **Remove the duplicate implementations**

### How to Check for Existing Implementations

**Search Commands to Use:**

```bash
# Search for function names
grep -r "functionName" src/ actions/

# Search for concepts (e.g., "validate", "format", "build")
grep -r "validateProduct" src/ actions/
grep -r "formatDate" src/ actions/
grep -r "buildUrl" src/ actions/

# Search for imports to see what's already available
grep -r "require.*utils" src/ actions/
grep -r "import.*utils" src/ actions/
```

**Places to Check:**

- `src/core/` - Core utilities
- `src/commerce/` - Commerce-specific utilities  
- `actions/*/lib/` - Action-specific helpers
- `actions/*/steps/` - Step functions
- Look for `utils.js`, `helpers.js`, `index.js` files

**Questions to Ask:**

- Is there already a utility that does this?
- Can I extend an existing function instead of creating a new one?
- Are there similar patterns I should follow?
- Would consolidating improve the codebase?

## Red Flags - Stop and Reconsider

🚩 **Creating more lines of code than you're improving**
🚩 **Making simple operations more complex**
🚩 **Breaking working functionality**
🚩 **Creating patterns that can't be applied elsewhere**
🚩 **Abstracting code that's only used in one place**
🚩 **Making code that requires deep knowledge to understand**
🚩 **Creating a new way to do something that already exists**
🚩 **Ignoring existing patterns and creating your own**
🚩 **Adding functionality without checking for duplicates**
🚩 **Making changes too large to easily test and rollback**
🚩 **Changing multiple concerns in a single commit**
🚩 **Skipping deployment testing because "it should work"**

## Success Metrics

After refactoring, the codebase should be:

- **Easier to onboard new developers**
- **Faster to make common modifications**
- **More consistent in patterns and style**
- **Clearer about what each function does**
- **Equally or more reliable than before**

## Review Process

1. **Self-Review**: Apply the decision rubric
2. **Test**: Verify functionality is preserved
3. **Document**: Clear commit message explaining the benefit
4. **Consistency Check**: Ensure change follows established patterns

## Recent Successful Patterns

### Configuration Simplification ✅

**Problem**: Complex multi-environment configuration with 8+ files, environment detection, and merging logic.

**Solution**: Single `config/index.js` file with direct environment variable access.

**Results**:

- 300+ lines → 170 lines (43% reduction)
- 8+ files → 1 file (87% reduction)
- No environment detection complexity
- Direct `process.env` access instead of complex overrides
- Backward compatible with existing actions

**Pattern**: When configuration becomes complex, question whether environment separation is necessary at the application level (vs infrastructure level). Adobe I/O workspaces already handle environment separation.

**Approval Criteria Met**:

- ✅ **Clarity**: Much easier to understand (one file vs 8+)
- ✅ **Necessity**: Solved real pain point (finding configuration)
- ✅ **Consistency**: Follows direct environment variable patterns
- ✅ **Safety**: Backward compatible with existing actions
- ✅ **Practicality**: Makes future configuration changes much easier
- ✅ **Uniqueness**: Eliminates multiple ways to configure same thing
- ✅ **Functional**: Pure configuration object with simple loading
- ✅ **Discoverable**: One place to find all configuration
