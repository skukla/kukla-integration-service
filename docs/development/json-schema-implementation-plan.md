# JSON Schema Multi-Source Implementation Plan

## Overview

This document provides a detailed implementation plan for migrating from the current monolithic custom resolver to a JSON Schema multi-source architecture. The plan is designed to maintain current functionality while achieving the goals of configuration transparency and resolver maintainability.

## Pre-Implementation Assessment

### Current Working State

- ✅ **119 Products Processing**: Successfully processing and generating CSV exports
- ✅ **OAuth 1.0 Authentication**: Working OAuth implementation for Commerce API
- ✅ **CSV Generation**: 23.99 KB CSV output in Adobe Recommendations format
- ✅ **API Mesh Deployment**: Functional mesh with ID `e4865722-2b0a-4f3f-bc87-f3302b64487b`
- ✅ **Commerce Instance**: Connected to `citisignal-com774.adobedemo.com`

### Migration Goals

1. **Zero Downtime**: Maintain current functionality throughout migration
2. **Gradual Transition**: Implement source-by-source migration
3. **Performance Preservation**: Match or exceed current performance metrics
4. **Feature Parity**: Identical CSV output and processing capability

## Implementation Phases

### Phase 1: Foundation Setup (Days 1-3)

#### Day 1: JSON Schema Source Configuration

**Objective**: Create basic JSON Schema source definitions

**Tasks:**

1. **Create sample data files for type generation**

   ```bash
   mkdir -p samples/json-schemas
   ```

2. **Generate sample files from current API responses**

   ```bash
   # Extract sample responses from current mesh resolver
   node scripts/extract-api-samples.js
   ```

3. **Create initial JSON Schema source configurations**
   - File: `mesh-json-schema.json`
   - Define three sources: Products, Categories, Inventory

**Deliverables:**

- ✅ `samples/json-schemas/products-response.json`
- ✅ `samples/json-schemas/categories-response.json`  
- ✅ `samples/json-schemas/inventory-response.json`
- ✅ `mesh-json-schema.json` (initial configuration)

#### Day 2: Authentication Configuration  

**Objective**: Set up per-source authentication patterns

**Tasks:**

1. **Configure OAuth 1.0 for Products/Categories sources**

   ```yaml
   operationHeaders:
     Authorization: "OAuth {context.headers.oauth-signature}"
   ```

2. **Configure Admin Token for Inventory source**

   ```yaml
   operationHeaders:
     Authorization: "Bearer {env.ADMIN_TOKEN}"
   ```

3. **Test authentication for each source individually**

**Deliverables:**

- ✅ Authentication working for CommerceProducts source
- ✅ Authentication working for CommerceCategories source
- ✅ Authentication working for CommerceInventory source

#### Day 3: Basic Operation Definitions

**Objective**: Define core operations for each source

**Tasks:**

1. **Define Products source operations**

   ```yaml
   operations:
     - type: Query
       field: products
       path: /products
       method: GET
       responseSample: ./samples/json-schemas/products-response.json
   ```

2. **Define Categories source operations**

   ```yaml
   operations:
     - type: Query
       field: category
       path: /categories/{args.id}
       method: GET
       responseSample: ./samples/json-schemas/categories-response.json
   ```

3. **Define Inventory source operations**

   ```yaml
   operations:
     - type: Query
       field: inventory
       path: /inventory/source-items
       method: GET
       responseSample: ./samples/json-schemas/inventory-response.json
   ```

**Deliverables:**

- ✅ Complete operation definitions for all three sources
- ✅ Basic GraphQL schema generation working
- ✅ Individual source queries executable

### Phase 2: Resolver Migration (Days 4-7)

#### Day 4: Extract Current Resolver Logic

**Objective**: Analyze and document current resolver functionality

**Tasks:**

1. **Document current resolver data flow**

   ```bash
   # Create analysis of current mesh-resolvers.js
   node scripts/analyze-current-resolver.js > docs/current-resolver-analysis.md
   ```

2. **Identify reusable transformation logic**
   - Extract `buildProducts` compatible functions
   - Identify category mapping logic  
   - Document inventory enrichment patterns

3. **Create migration mapping document**

**Deliverables:**

- ✅ `docs/current-resolver-analysis.md`
- ✅ `docs/resolver-migration-mapping.md`
- ✅ List of reusable transformation functions

#### Day 5: Create Product Enrichment Resolver

**Objective**: Build focused resolver for product data enrichment

**Tasks:**

1. **Create `resolvers/product-enrichment.js`**

   ```javascript
   module.exports = {
     Query: {
       enrichedProducts: async (parent, args, context) => {
         // Call CommerceProducts source
         const products = await context.CommerceProducts.Query.products(args);
         
         // Apply minimal product-specific transformations
         return products.map(product => ({
           ...product,
           // Basic product normalization
         }));
       }
     }
   };
   ```

2. **Integrate with existing `buildProducts` step**
3. **Test product retrieval and basic transformation**

**Deliverables:**

- ✅ `resolvers/product-enrichment.js`
- ✅ Products source integration working
- ✅ Basic product transformation functional

#### Day 6: Create Category Integration Resolver

**Objective**: Build resolver for category data relationships

**Tasks:**

1. **Create `resolvers/category-integration.js`**

   ```javascript
   module.exports = {
     Product: {
       categories: async (product, args, context) => {
         // Extract category IDs from product
         const categoryIds = product.category_links?.map(link => link.category_id) || [];
         
         // Fetch category data for each ID
         const categories = await Promise.all(
           categoryIds.map(id => 
             context.CommerceCategories.Query.category({ id })
           )
         );
         
         return categories.filter(Boolean);
       }
     }
   };
   ```

2. **Implement category caching strategy**
3. **Test category relationship resolution**

**Deliverables:**

- ✅ `resolvers/category-integration.js`
- ✅ Category relationship resolution working
- ✅ Category caching implemented

#### Day 7: Create Inventory Integration Resolver  

**Objective**: Build resolver for inventory data enrichment

**Tasks:**

1. **Create `resolvers/inventory-integration.js`**

   ```javascript
   module.exports = {
     Product: {
       inventory: async (product, args, context) => {
         try {
           const inventory = await context.CommerceInventory.Query.inventory({
             sku: product.sku
           });
           return inventory;
         } catch (error) {
           // Graceful fallback for missing inventory
           return { qty: 0, is_in_stock: false };
         }
       }
     }
   };
   ```

2. **Implement inventory error handling**
3. **Test inventory data integration**

**Deliverables:**

- ✅ `resolvers/inventory-integration.js`
- ✅ Inventory integration working
- ✅ Error handling for missing inventory data

### Phase 3: Integration & Type Merging (Days 8-10)

#### Day 8: Configure Type Merging

**Objective**: Set up automatic type merging between sources

**Tasks:**

1. **Define unified Product type**

   ```yaml
   additionalTypeDefs: |
     extend type Product {
       categories: [Category]
       inventory: InventoryItem
       # Preserve all existing fields
     }
   ```

2. **Configure type merging rules**

   ```yaml
   transforms:
     - typeMerging:
         Product:
           key: sku
           resolve: (root, context, info) => root.sku
   ```

3. **Test unified type resolution**

**Deliverables:**

- ✅ Type merging configuration working
- ✅ Unified Product type with all relationships
- ✅ SKU-based type merging functional

#### Day 9: Source-Specific Transforms

**Objective**: Configure transforms per source for data normalization

**Tasks:**

1. **Configure Products source transforms**

   ```yaml
   transforms:
     - rename:
         renames:
           - from: { field: "media_gallery_entries" }
             to: { field: "images" }
     - filter:
         schema: |
           type Query {
             products: [Product]
           }
   ```

2. **Configure Categories source transforms**
3. **Configure Inventory source transforms**

**Deliverables:**

- ✅ Source-specific transforms configured
- ✅ Data normalization working per source
- ✅ Field mapping aligned with current CSV output

#### Day 10: End-to-End Integration Testing

**Objective**: Validate complete data flow through all sources

**Tasks:**

1. **Test complete product enrichment flow**

   ```graphql
   query {
     enrichedProducts {
       sku
       name
       categories {
         id
         name
       }
       inventory {
         qty
         is_in_stock
       }
     }
   }
   ```

2. **Validate CSV generation parity**
3. **Performance benchmark against current implementation**

**Deliverables:**

- ✅ End-to-end data flow working
- ✅ CSV output matching current format
- ✅ Performance metrics documented

### Phase 4: Optimization & Deployment (Days 11-14)

#### Day 11: Performance Optimization

**Objective**: Implement caching and performance enhancements

**Tasks:**

1. **Configure source-level caching**

   ```yaml
   cache:
     - field: categories
       cacheKey: "category:{args.id}"
       ttl: 3600
   ```

2. **Implement batching for category requests**
3. **Add performance monitoring**

**Deliverables:**

- ✅ Source-specific caching strategies
- ✅ Request batching optimizations  
- ✅ Performance monitoring implemented

#### Day 12: Error Handling & Resilience

**Objective**: Add robust error handling and fallback mechanisms

**Tasks:**

1. **Implement source-specific error boundaries**
2. **Add retry logic per source**
3. **Configure graceful degradation**

**Deliverables:**

- ✅ Error boundaries per source
- ✅ Retry mechanisms configured
- ✅ Graceful degradation working

#### Day 13: Testing & Validation

**Objective**: Comprehensive testing of new architecture

**Tasks:**

1. **Run full test suite**

   ```bash
   npm run test:action get-products-mesh
   npm run test:perf:mesh
   ```

2. **Validate 119 product processing**
3. **Compare performance metrics**

**Deliverables:**

- ✅ All tests passing
- ✅ 119 product capability confirmed
- ✅ Performance parity achieved

#### Day 14: Deployment & Switchover

**Objective**: Deploy new mesh configuration

**Tasks:**

1. **Deploy new mesh configuration**

   ```bash
   npm run deploy:mesh
   ```

2. **Update App Builder action to use new mesh endpoint**
3. **Monitor production performance**

**Deliverables:**

- ✅ New mesh deployed
- ✅ App Builder action updated
- ✅ Production monitoring active

## Implementation Scripts

### Sample Data Extraction Script

```javascript
// scripts/extract-api-samples.js
const fs = require('fs');
const { makeCommerceRequest } = require('../src/commerce/api/integration');

async function extractSamples() {
  // Extract product sample
  const productsResponse = await makeCommerceRequest('/products', { method: 'GET' });
  fs.writeFileSync(
    'samples/json-schemas/products-response.json', 
    JSON.stringify(productsResponse, null, 2)
  );

  // Extract category sample  
  const categoryResponse = await makeCommerceRequest('/categories/2', { method: 'GET' });
  fs.writeFileSync(
    'samples/json-schemas/categories-response.json',
    JSON.stringify(categoryResponse, null, 2)
  );

  // Extract inventory sample
  const inventoryResponse = await makeCommerceRequest('/inventory/source-items', { method: 'GET' });
  fs.writeFileSync(
    'samples/json-schemas/inventory-response.json',
    JSON.stringify(inventoryResponse, null, 2)
  );
}

extractSamples().catch(console.error);
```

### Migration Validation Script

```javascript
// scripts/validate-migration.js
async function validateMigration() {
  console.log('🔍 Validating JSON Schema Multi-Source Migration...');
  
  // Test individual sources
  const productTest = await testProductsSource();
  const categoryTest = await testCategoriesSource();
  const inventoryTest = await testInventorySource();
  
  // Test integrated query
  const integrationTest = await testIntegratedQuery();
  
  // Test CSV generation
  const csvTest = await testCSVGeneration();
  
  console.log('✅ Migration validation complete');
  return {
    products: productTest,
    categories: categoryTest,
    inventory: inventoryTest,
    integration: integrationTest,
    csv: csvTest
  };
}
```

## Risk Mitigation

### Rollback Plan

1. **Immediate Rollback**: Revert to previous mesh configuration
2. **Action Fallback**: App Builder action can switch between mesh endpoints
3. **Data Backup**: Current CSV generation preserved as fallback

### Monitoring & Alerts

1. **Performance Monitoring**: Track response times per source
2. **Error Rate Monitoring**: Alert on source-specific errors
3. **Data Quality Checks**: Validate CSV output consistency

### Testing Strategy

1. **Unit Tests**: Per resolver and source configuration
2. **Integration Tests**: End-to-end data flow validation
3. **Performance Tests**: Load testing with 119+ products
4. **Compatibility Tests**: CSV format validation

## Success Criteria

### Functional Requirements (Must Have)

- [ ] **119 Product Processing**: Process full product catalog
- [ ] **Identical CSV Output**: Match current CSV format exactly
- [ ] **OAuth Authentication**: Preserve current auth implementation
- [ ] **Performance Parity**: Match current response times

### Architecture Goals (Should Have)

- [ ] **Configuration Transparency**: Clear source-endpoint mapping visible
- [ ] **Resolver Size Reduction**: Each resolver under 100 lines
- [ ] **Independent Source Testing**: Ability to test sources in isolation
- [ ] **Native Mesh Features**: Utilize built-in caching, transforms, batching

### Quality Improvements (Nice to Have)

- [ ] **Error Isolation**: Source failures don't cascade
- [ ] **Performance Gains**: Improved response times through optimization
- [ ] **Development Velocity**: Faster iteration on individual sources
- [ ] **Maintainability**: Clearer code organization and documentation

## Post-Implementation Benefits

### Immediate Benefits

1. **Configuration Clarity**: True multi-source architecture visible in config
2. **Resolver Maintainability**: Smaller, focused resolver files
3. **Independent Testing**: Test and debug sources individually
4. **Error Isolation**: Source failures contained and recoverable

### Long-term Benefits  

1. **Performance Optimization**: Source-specific caching and batching
2. **Feature Development**: Easier to add new sources or modify existing ones
3. **Monitoring & Debugging**: Clear source-specific metrics and logging
4. **Native Mesh Integration**: Leverage full mesh feature set

### Development Experience

1. **Faster Iteration**: Change one source without affecting others
2. **Clearer Debugging**: Trace issues to specific sources
3. **Better Testing**: Unit test individual resolvers and sources
4. **Improved Documentation**: Self-documenting configuration structure

## Conclusion

This implementation plan provides a systematic approach to migrating from the monolithic custom resolver to a transparent, maintainable JSON Schema multi-source architecture. The phased approach ensures zero downtime while achieving all original goals of configuration transparency and resolver maintainability.
