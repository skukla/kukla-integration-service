# Architecture Migration Plan

## Overview

This document outlines the step-by-step migration from the current scattered utility architecture to a functional composition and discoverability-first architecture.

## Current vs Target Architecture

### Current Structure (Problems)
```text
src/
├── core/                        # 🔴 Too generic, hard to find
│   ├── http/
│   ├── storage/
│   ├── utils.js
├── commerce/                    # 🔴 Mixed with core concerns
│   ├── api/
│   ├── transform/
actions/
├── backend/
│   ├── get-products/
│   │   ├── lib/                # 🔴 Duplicated utilities
│   │   ├── steps/              # 🔴 Action-specific helpers
```

### Target Structure (Solutions)
```text
src/
├── index.js                    # 🎯 Single catalog entry point
├── products/                   # 🎯 Domain-organized
│   ├── index.js               # 🎯 Domain catalog
│   ├── fetch.js               # 🎯 Pure functions
│   ├── transform.js
│   └── validate.js
├── files/
│   ├── index.js
│   ├── storage.js
│   └── browser.js
├── commerce/
│   ├── index.js
│   ├── auth.js
│   └── api.js
├── shared/                     # 🎯 Only truly shared utilities
│   ├── index.js
│   ├── config.js
│   ├── http.js
│   └── utils.js
actions/
├── get-products.js            # 🎯 Thin orchestrators
├── browse-files.js
└── download-file.js
```

## Migration Strategy

### Phase 0: Configuration Simplification (DOCUMENTED - TO BE IMPLEMENTED) ⏳

**Goal**: Replace complex multi-environment configuration with simple, environment-variable-based system.

**IMPLEMENTATION DETAILS** (from preliminary work):

**Configuration Redesign Pattern:**
```javascript
// New Single File: config/index.js (271 lines)
const config = {
  // Direct environment variable access
  commerce: {
    baseUrl: process.env.COMMERCE_BASE_URL,
    oauth: {
      consumerKey: process.env.COMMERCE_CONSUMER_KEY,
      consumerSecret: process.env.COMMERCE_CONSUMER_SECRET,
      accessToken: process.env.COMMERCE_ACCESS_TOKEN,
      accessTokenSecret: process.env.COMMERCE_ACCESS_TOKEN_SECRET,
    },
  },
  
  storage: {
    provider: 's3', // or 'app-builder'
    s3: {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    },
  },
  
  mesh: {
    endpoint: process.env.API_MESH_ENDPOINT,
    apiKey: process.env.MESH_API_KEY,
  },
  
  runtime: {
    url: process.env.RUNTIME_URL,
  },
};

// Backward compatibility function
function loadConfig(params = {}) {
  // Allow action parameters to override environment variables
  const overrides = {};
  
  if (params.COMMERCE_CONSUMER_KEY) {
    overrides.commerce = {
      ...config.commerce,
      oauth: {
        consumerKey: params.COMMERCE_CONSUMER_KEY,
        consumerSecret: params.COMMERCE_CONSUMER_SECRET,
        accessToken: params.COMMERCE_ACCESS_TOKEN,
        accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET,
      },
    };
  }
  
  return { ...config, ...overrides };
}
```

**Files to Remove:**
- `config/base.js` - Base configuration (replaced by direct env vars)
- `config/environments/staging.js` - Environment-specific config
- `config/environments/production.js` - Environment-specific config
- `config/schema/core.schema.js` - Configuration validation (simplified)
- `config/schema/api.schema.js` - API validation (simplified)
- `config/schema/index.js` - Schema exports
- `src/core/environment.js` - Environment detection (Adobe I/O workspaces handle this)

**Scripts to Update:**
- `scripts/test-action.js` - Remove detectEnvironment import
- `scripts/deploy.js` - Remove detectEnvironment import  
- `scripts/generate-mesh-resolver.js` - Remove detectEnvironment import
- `scripts/build.js` - Remove detectEnvironment import
- `scripts/generate-frontend.js` - Remove detectEnvironment import

**Benefits of This Approach:**
- ✅ Single source of truth for configuration
- ✅ No complex environment detection or merging
- ✅ Adobe I/O workspaces naturally handle environment separation
- ✅ Direct environment variable access (no weird override patterns)
- ✅ Simplified from 300+ lines across 8 files to 271 lines in 1 file
- ✅ Maintains backward compatibility with existing actions

**Key Principle:** Adobe I/O workspaces (staging/production) handle environment separation automatically, so we don't need complex environment detection in our code.

**Testing Requirements:**
- All existing actions must continue to work
- Configuration loading must maintain same API
- Scripts must work without environment detection
- Deployment must work to both staging and production

### Phase 1: Create Catalog Foundation (1-2 hours)
**Goal**: Establish the new structure without breaking existing functionality

1. **Create main catalog**
   ```bash
   # Create the new structure
   mkdir -p src/products src/files src/commerce src/shared
   touch src/index.js src/products/index.js src/files/index.js src/commerce/index.js src/shared/index.js
   ```

2. **Create placeholder catalogs**
   ```javascript
   // src/index.js
   module.exports = {
     products: require('./products'),
     files: require('./files'),
     commerce: require('./commerce'),
     shared: require('./shared'),
   };
   
   // src/products/index.js (placeholder)
   module.exports = {
     // Will be populated in Phase 2
   };
   ```

3. **Test**: Verify structure creation doesn't break deployment

### Phase 2: Migrate Products Domain (2-3 hours)
**Goal**: Move all product-related functionality to `src/products/`

**Current product functionality locations:**
- `actions/backend/get-products/steps/` - buildProducts, fetchAndEnrichProducts
- `actions/backend/get-products/lib/api/` - product fetching, category enrichment
- `src/commerce/transform/product.js` - product transformation
- `src/commerce/data/product.js` - product validation

**Migration steps:**

1. **Create product domain files**
   ```javascript
   // src/products/fetch.js
   const { makeCommerceRequest } = require('../commerce/api');
   
   async function fetchProducts(config) {
     // Move logic from actions/backend/get-products/lib/api/products.js
   }
   
   async function enrichWithCategories(products, config) {
     // Move logic from lib/api/enrichProductsWithCategories/
   }
   
   module.exports = { fetchProducts, enrichWithCategories };
   ```

   ```javascript
   // src/products/transform.js
   function buildProductCsv(products) {
     // Move logic from steps/buildProducts.js and steps/createCsv.js
   }
   
   function formatProductData(product) {
     // Move logic from src/commerce/transform/product.js
   }
   
   module.exports = { buildProductCsv, formatProductData };
   ```

   ```javascript
   // src/products/validate.js
   function validateProductData(products) {
     // Move logic from steps/validateInput.js and src/commerce/data/product.js
   }
   
   module.exports = { validateProductData };
   ```

2. **Update products catalog**
   ```javascript
   // src/products/index.js
   module.exports = {
     // Fetch operations
     fetchProducts: require('./fetch').fetchProducts,
     enrichWithCategories: require('./fetch').enrichWithCategories,
     
     // Transform operations
     buildProductCsv: require('./transform').buildProductCsv,
     formatProductData: require('./transform').formatProductData,
     
     // Validation
     validateProductData: require('./validate').validateProductData,
   };
   ```

3. **Test**: `npm run test:action get-products` should still work

### Phase 3: Migrate Files Domain (2-3 hours)
**Goal**: Move all file-related functionality to `src/files/`

**Current file functionality locations:**
- `src/core/storage/` - storage operations
- `actions/backend/get-products/steps/storeCsv.js` - CSV storage
- `actions/frontend/browse-files/` - file browser logic
- `actions/backend/download-file/` - download logic
- `actions/backend/delete-file/` - delete logic

**Migration steps:**

1. **Create file domain files**
   ```javascript
   // src/files/storage.js
   async function storeFile(data, config) {
     // Move logic from src/core/storage/ and steps/storeCsv.js
   }
   
   async function deleteFile(fileName, config) {
     // Move logic from actions/backend/delete-file/
   }
   
   async function downloadFile(fileName, config) {
     // Move logic from actions/backend/download-file/
   }
   
   module.exports = { storeFile, deleteFile, downloadFile };
   ```

   ```javascript
   // src/files/browser.js
   function listFiles(config) {
     // Move logic from actions/frontend/browse-files/
   }
   
   function generateBrowserHtml(files) {
     // Move HTML generation logic
   }
   
   module.exports = { listFiles, generateBrowserHtml };
   ```

2. **Test**: All file operations should work

### Phase 4: Migrate Commerce Domain (1-2 hours)
**Goal**: Move Commerce API integration to `src/commerce/`

**Current commerce functionality locations:**
- `src/commerce/api/` - OAuth, API calls
- `actions/backend/get-products/lib/auth.js` - authentication

**Migration steps:**

1. **Create commerce domain files**
   ```javascript
   // src/commerce/auth.js
   function createOAuthHeader(credentials, url, method) {
     // Move from src/commerce/api/createOAuthHeader/
   }
   
   module.exports = { createOAuthHeader };
   ```

   ```javascript
   // src/commerce/api.js
   async function callCommerceApi(endpoint, config) {
     // Move from src/commerce/api/integration.js
   }
   
   function buildCommerceUrl(baseUrl, endpoint) {
     // Move URL building logic
   }
   
   module.exports = { callCommerceApi, buildCommerceUrl };
   ```

### Phase 5: Migrate Shared Utilities (1-2 hours)
**Goal**: Move truly shared utilities to `src/shared/`

**Current shared functionality locations:**
- `src/core/http/` - HTTP utilities
- `src/core/tracing/` - performance tracking
- `config/` - configuration system
- `src/core/utils.js` - generic utilities

**Migration steps:**

1. **Create shared domain files**
   ```javascript
   // src/shared/config.js
   function loadConfig(params) {
     // Move from config/index.js
   }
   
   function getEnvironment(params) {
     // Move from src/core/environment.js
   }
   
   module.exports = { loadConfig, getEnvironment };
   ```

   ```javascript
   // src/shared/http.js
   async function httpGet(url, options) {
     // Move from src/core/http/
   }
   
   async function httpPost(url, data, options) {
     // Move from src/core/http/
   }
   
   module.exports = { httpGet, httpPost };
   ```

   ```javascript
   // src/shared/utils.js
   function formatFileSize(bytes) {
     // Move from src/core/utils.js
   }
   
   function formatStepMessage(step, status, data) {
     // Move from src/core/utils.js
   }
   
   module.exports = { formatFileSize, formatStepMessage };
   ```

### Phase 6: Update Actions to Use Catalogs (2-3 hours)
**Goal**: Convert actions to thin orchestrators

**Migration steps:**

1. **Update get-products action**
   ```javascript
   // actions/backend/get-products/index.js
   const { products, files, shared } = require('../../../src');
   
   async function main(params) {
     const config = shared.loadConfig(params);
     
     // Thin orchestration only
     const productData = await products.fetchProducts(config);
     const enrichedData = await products.enrichWithCategories(productData, config);
     const csvData = products.buildProductCsv(enrichedData);
     const storageResult = await files.storeFile(csvData, config);
     
     return shared.createSuccessResponse(storageResult);
   }
   ```

2. **Update other actions similarly**

3. **Test**: All actions should work with new architecture

### Phase 7: Remove Old Structure (1 hour)
**Goal**: Clean up old scattered utilities

1. **Remove old directories**
   ```bash
   rm -rf actions/backend/get-products/lib/
   rm -rf actions/backend/get-products/steps/
   rm -rf src/core/ (except what's moved to shared)
   ```

2. **Final test**: Full application functionality

## Testing Strategy

**After each phase:**
1. `npm run deploy`
2. `npm run test:action get-products`
3. `npm run test:action browse-files`
4. Test file upload/download manually

## Risk Mitigation

1. **Small phases**: Each phase is 1-3 hours, easy to rollback
2. **Test after each phase**: Catch issues immediately
3. **Keep old code until end**: Remove only after everything works
4. **Clear rollback plan**: `git reset --hard` to previous working state

## Success Metrics

**After migration, developers should be able to:**
1. **Find any functionality in under 30 seconds** using `src/index.js`
2. **Add new product functionality** by going to `src/products/`
3. **Understand action flow** by reading thin orchestrator functions
4. **Test individual functions** without complex setup
5. **Make changes** that affect only one domain

## Estimated Timeline

- **Phase 1-2**: 3-5 hours (Foundation + Products)
- **Phase 3-4**: 3-5 hours (Files + Commerce)
- **Phase 5-6**: 3-5 hours (Shared + Actions)
- **Phase 7**: 1 hour (Cleanup)

**Total**: 10-16 hours over 2-3 development sessions 