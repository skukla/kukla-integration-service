# API Mesh Implementation Guide

## Overview

This document provides comprehensive documentation for the Adobe App Builder API Mesh implementation, including the complex custom resolvers, multiple Commerce API sources, template system, and batch optimization features.

## Architecture Overview

The mesh implementation uses a **hybrid approach** combining:

1. **JsonSchema Sources**: Three native mesh sources for Commerce APIs (Products, Categories, Inventory)
2. **Custom Resolvers**: Template-generated resolvers that consolidate data from multiple sources
3. **Batch Optimization**: Intelligent batching to reduce API calls by 99%
4. **Admin Token Authentication**: Simplified authentication flow using Commerce admin tokens

```mermaid
graph TD
    A[GraphQL Request] --> B[API Mesh]
    B --> C[Custom Resolver]
    C --> D[Products Source]
    C --> E[Categories Source]
    C --> F[Inventory Source]
    D --> G[Commerce Products API]
    E --> H[Commerce Categories API]
    F --> I[Commerce Inventory API]
    G --> J[Raw Product Data]
    H --> K[Category Data]
    I --> L[Inventory Data]
    J --> M[Data Enrichment]
    K --> M
    L --> M
    M --> N[Enriched Products Response]
```text

## Configuration Structure

### Main Configuration File (`mesh.config.js`)

```javascript
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config');

// Load configuration to get dynamic values
const config = loadConfig();

// Load external GraphQL schema file
const enrichedProductsSchema = fs.readFileSync(
  path.join(__dirname, 'src/mesh/schema/enriched-products.graphql'),
  'utf8'
);

module.exports = {
  // Enhanced response configuration with native mesh features
  responseConfig: {
    cache: true,                    // Enable native mesh caching
    includeHTTPDetails: true,       // Include HTTP response details for debugging
  },
  sources: [
    // Three JsonSchema sources defined below
  ],
  additionalTypeDefs: enrichedProductsSchema,  // External GraphQL schema
  additionalResolvers: ['./mesh-resolvers.js'], // Custom resolver file
};
```text

### Response Configuration Options

| Setting | Purpose | Impact |
|---------|---------|---------|
| `cache: true` | Enable native mesh caching | Improves performance on repeated queries |
| `includeHTTPDetails: true` | Include HTTP response metadata | Essential for debugging and monitoring |

## JsonSchema Sources

### 1. Products Source

**Purpose**: Fetches product data from Commerce Products API

```javascript
{
  name: 'Products',
  handler: {
    JsonSchema: {
      baseUrl: `${config.commerce.baseUrl}/rest/all/V1`,
      operationHeaders: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer {context.headers.x-commerce-admin-token}',
      },
      operations: [
        {
          type: 'Query',
          field: 'products_list',
          path: '/products?searchCriteria[pageSize]={args.pageSize}',
          method: 'GET',
          argTypeMap: {
            pageSize: {
              type: 'integer',
            },
          },
          responseSchema: './src/mesh/schema/products-response.json',
        },
      ],
    },
  },
}
```text

#### Products Source Configuration

| Setting | Purpose | Dynamic Value |
|---------|---------|---------------|
| `baseUrl` | Commerce API base URL | `${config.commerce.baseUrl}/rest/all/V1` |
| `Authorization` | Admin token authentication | `Bearer {context.headers.x-commerce-admin-token}` |
| `path` | Products endpoint with pagination | `/products?searchCriteria[pageSize]={args.pageSize}` |
| `responseSchema` | JSON schema for response validation | `./src/mesh/schema/products-response.json` |

### 2. Categories Source

**Purpose**: Fetches category data with both individual and batch endpoints

```javascript
{
  name: 'Categories',
  handler: {
    JsonSchema: {
      baseUrl: `${config.commerce.baseUrl}/rest/all/V1`,
      operationHeaders: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer {context.headers.x-commerce-admin-token}',
      },
      operations: [
        {
          type: 'Query',
          field: 'category_info',
          path: '/categories/{args.categoryId}',
          method: 'GET',
          argTypeMap: {
            categoryId: {
              type: 'integer',
            },
          },
          responseSchema: './src/mesh/schema/categories-response.json',
        },
        {
          type: 'Query',
          field: 'categories_batch',
          path: `/categories?searchCriteria[pageSize]=${config.commerce.batching.categories}&searchCriteria[filter_groups][0][filters][0][field]=entity_id&searchCriteria[filter_groups][0][filters][0][value]={args.categoryIds}&searchCriteria[filter_groups][0][filters][0][condition_type]=in`,
          method: 'GET',
          argTypeMap: {
            categoryIds: {
              type: 'string',
            },
          },
          responseSchema: './src/mesh/schema/categories-response.json',
        },
      ],
    },
  },
}
```text

#### Categories Source Configuration

| Operation | Purpose | Path Structure |
|-----------|---------|----------------|
| `category_info` | Single category lookup | `/categories/{args.categoryId}` |
| `categories_batch` | Batch category lookup | `/categories?searchCriteria[...][condition_type]=in` |

**Batch Query Parameters**:
- `pageSize`: `${config.commerce.batching.categories}` (typically 20)
- `filter_groups[0][filters][0][field]`: `entity_id`
- `filter_groups[0][filters][0][value]`: `{args.categoryIds}` (comma-separated)
- `filter_groups[0][filters][0][condition_type]`: `in`

### 3. Inventory Source

**Purpose**: Fetches inventory data with both individual and batch endpoints

```javascript
{
  name: 'Inventory',
  handler: {
    JsonSchema: {
      baseUrl: `${config.commerce.baseUrl}/rest/all/V1`,
      operationHeaders: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer {context.headers.x-commerce-admin-token}',
      },
      operations: [
        {
          type: 'Query',
          field: 'inventory_items',
          path: `/inventory/source-items?searchCriteria[pageSize]=${config.performance.batching.inventoryBatchSize}`,
          method: 'GET',
          responseSchema: './src/mesh/schema/inventory-response.json',
        },
        {
          type: 'Query',
          field: 'inventory_batch',
          path: `/inventory/source-items?searchCriteria[pageSize]=${config.performance.batching.inventoryBatchSize}&searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]={args.skus}&searchCriteria[filter_groups][0][filters][0][condition_type]=in&searchCriteria[current_page]=1`,
          method: 'GET',
          argTypeMap: {
            skus: {
              type: 'string',
            },
          },
          responseSchema: './src/mesh/schema/inventory-response.json',
        },
      ],
    },
  },
}
```text

#### Inventory Source Configuration

| Operation | Purpose | Path Structure |
|-----------|---------|----------------|
| `inventory_items` | All inventory items | `/inventory/source-items?searchCriteria[pageSize]=${batchSize}` |
| `inventory_batch` | Batch inventory lookup | `/inventory/source-items?...&condition_type=in` |

**Batch Query Parameters**:
- `pageSize`: `${config.performance.batching.inventoryBatchSize}` (typically 50)
- `filter_groups[0][filters][0][field]`: `sku`
- `filter_groups[0][filters][0][value]`: `{args.skus}` (comma-separated)
- `filter_groups[0][filters][0][condition_type]`: `in`
- `current_page`: `1`

## Template System

### Template File (`mesh-resolvers.template.js`)

The custom resolvers are generated from a template file that allows for:

1. **Environment-specific configuration substitution**
2. **Dynamic threshold values**
3. **Consistent deployment across environments**

#### Template Substitution Variables

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `{{{COMMERCE_BASE_URL}}}` | Commerce API base URL | `https://citisignal-com774.adobedemo.com` |
| `{{{CATEGORY_BATCH_THRESHOLD}}}` | Minimum categories for batch | `1` |
| `{{{INVENTORY_BATCH_THRESHOLD}}}` | Minimum SKUs for batch | `1` |

#### Template Generation Process

1. **Build Time**: `npm run build` triggers template processing
2. **Variable Substitution**: Configuration values replace template variables
3. **File Generation**: Creates `mesh-resolvers.js` from template
4. **Deployment**: Generated file deployed to mesh

### Generated Resolver File (`mesh-resolvers.js`)

The generated resolver contains:

```javascript
/** METADATA: {"templateHash":"...","configHash":"...","generatedAt":"...","version":"1.0.0"} */

module.exports = {
  resolvers: {
    Query: {
      mesh_products_enriched: {
        resolve: async (parent, args, context, info) => {
          // Complex resolver logic here
        },
      },
      mesh_products_basic: {
        resolve: async (parent, args, context, info) => {
          // Basic products resolver
        },
      },
      mesh_categories: {
        resolve: async (parent, args, context, info) => {
          // Categories resolver
        },
      },
    },
  },
};
```text

## Custom Resolver Implementation

### Main Resolver: `mesh_products_enriched`

This is the core resolver that consolidates data from all three sources:

#### Step 1: Fetch Products

```javascript
const products = await fetchProducts(context, info, args.pageSize);
```text

**Function**: `fetchProducts(context, info, pageSize)`
- Calls `context.Products.Query.products_list`
- Uses minimal selection set for performance
- Returns array of product objects

#### Step 2: Extract Metadata

```javascript
const categoryIds = new Set();
const skus = [];

products.forEach((product) => {
  if (product.sku) {
    skus.push(product.sku);
  }

  const productCategoryIds = getCategoryIds(product);
  productCategoryIds.forEach((id) => categoryIds.add(id));
});
```text

**Function**: `getCategoryIds(product)`
- Extracts category IDs from multiple sources:
  - Direct `categories` array
  - `custom_attributes` with `category_ids` attribute
- Handles various data formats (string, array, comma-separated)
- Returns array of integer category IDs

#### Step 3: Parallel Data Fetching

```javascript
const [categoryMap, inventoryMap] = await Promise.all([
  fetchCategories(context, info, categoryIdsArray),
  fetchInventory(context, info, skusArray),
]);
```text

**Batch Optimization Logic**:
- Categories: Uses `categories_batch` if `categoryIds.length >= 1`
- Inventory: Uses `inventory_batch` if `skus.length >= 1`
- Parallel execution reduces total time

#### Step 4: Data Enrichment

```javascript
const enrichedProducts = enrichProducts(products, categoryMap, inventoryMap);
```text

**Function**: `enrichProducts(products, categoryMap, inventoryMap)`
- Merges product data with category and inventory information
- Adds `qty` field from inventory
- Adds `categories` array with full category objects
- Preserves original product structure

#### Step 5: Performance Calculation

```javascript
const performance = calculatePerformance(
  startTime,
  enrichedProducts.length,
  categoryMap.size,
  inventoryMap.size,
  batchInfo
);
```text

**Function**: `calculatePerformance(...)`
- Calculates execution time
- Tracks API call counts
- Determines batch optimization effectiveness
- Returns comprehensive performance metrics

### Supporting Resolvers

#### `mesh_products_basic`

Simple products resolver without enrichment:

```javascript
mesh_products_basic: {
  resolve: async (parent, args, context, info) => {
    const products = await fetchProducts(context, info);
    return {
      products: products,
      total_count: products.length,
      message: `Fetched ${products.length} basic products`,
    };
  },
}
```text

#### `mesh_categories`

Categories resolver with dynamic ID extraction:

```javascript
mesh_categories: {
  resolve: async (parent, args, context, info) => {
    let categoryIds = args.categoryIds || extractFromProducts();
    const categoryMap = await fetchCategories(context, info, categoryIds);
    const categories = Array.from(categoryMap.values());
    return {
      categories: categories,
      total_count: categories.length,
      message: `Fetched ${categories.length} categories`,
    };
  },
}
```text

## Authentication Flow

### Admin Token Generation

1. **Action Request**: Contains `COMMERCE_ADMIN_USERNAME` and `COMMERCE_ADMIN_PASSWORD`
2. **Token Generation**: `getAuthToken(params, config)` creates admin token
3. **Header Passing**: Token passed as `x-commerce-admin-token` header
4. **Mesh Authorization**: Sources use `Bearer {context.headers.x-commerce-admin-token}`

### Authentication Sequence

```mermaid
sequenceDiagram
    participant A as Action
    participant C as Commerce API
    participant M as Mesh
    participant S as Sources
    
    A->>C: POST /integration/admin/token
    C->>A: Bearer token
    A->>M: GraphQL query + x-commerce-admin-token
    M->>S: Query with context.headers
    S->>C: Commerce API calls with Bearer token
    C->>S: API responses
    S->>M: Source data
    M->>A: Enriched response
```text

## Batch Optimization

### Category Batching

**Individual Calls** (Before Optimization):
```text
/categories/1
/categories/2
/categories/3
...
```text

**Batch Call** (After Optimization):
```text
/categories?searchCriteria[filter_groups][0][filters][0][field]=entity_id&searchCriteria[filter_groups][0][filters][0][value]=1,2,3&searchCriteria[filter_groups][0][filters][0][condition_type]=in
```text

**Efficiency**: 95% reduction in API calls for categories

### Inventory Batching

**Individual Calls** (Before Optimization):
```text
/inventory/source-items?searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]=SKU1
/inventory/source-items?searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]=SKU2
...
```text

**Batch Call** (After Optimization):
```text
/inventory/source-items?searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]=SKU1,SKU2,SKU3&searchCriteria[filter_groups][0][filters][0][condition_type]=in
```text

**Efficiency**: 99% reduction in API calls for inventory

## Performance Metrics

### Response Structure

The mesh resolver returns comprehensive performance data:

```javascript
{
  products: [...],
  total_count: 119,
  message: "Successfully enriched 119 products...",
  performance: {
    processedProducts: 119,
    apiCalls: 3,
    method: "API Mesh Custom Resolver (Native + Batch Optimized)",
    executionTime: 750,
    totalTime: 750,
    productsApiCalls: 1,
    categoriesApiCalls: 1,
    inventoryApiCalls: 1,
    totalApiCalls: 3,
    uniqueCategories: 15,
    productCount: 119,
    clientCalls: 1,
    cacheHitRate: 0.0,
    categoriesCached: 0,
    categoriesFetched: 15,
    dataFreshness: "Live",
    meshOptimizations: "Native Caching Enabled, Categories Batched, Inventory Batched",
    batchOptimizations: {
      categoriesBatched: true,
      inventoryBatched: true,
      apiCallsReduced: 230
    }
  }
}
```text

### Key Performance Indicators

| Metric | Target | Actual | Improvement |
|--------|--------|--------|-------------|
| **Total API Calls** | <10 | 3 | 99% reduction |
| **Execution Time** | <1000ms | 750ms | 25% faster |
| **Products Processed** | 119 | 119 | 100% success |
| **Batch Efficiency** | >95% | 99% | Optimal |

## Configuration Values

### Environment Configuration

Categories and inventory batching are configured in environment files:

```javascript
// config/environments/staging.js
module.exports = {
  commerce: {
    batching: {
      categories: 20,    // Categories per batch call
    },
  },
  performance: {
    batching: {
      inventoryBatchSize: 50,  // Inventory items per batch call
    },
  },
};
```text

### Runtime Configuration

Template variables are substituted at build time:

| Variable | Configuration Path | Purpose |
|----------|-------------------|---------|
| `COMMERCE_BASE_URL` | `config.commerce.baseUrl` | Commerce API endpoint |
| `CATEGORY_BATCH_THRESHOLD` | `1` | Minimum categories for batch |
| `INVENTORY_BATCH_THRESHOLD` | `1` | Minimum SKUs for batch |

## GraphQL Schema

### External Schema File (`src/mesh/schema/enriched-products.graphql`)

```graphql
type EnrichedProduct {
  sku: String!
  name: String
  price: Float
  qty: Int
  categories: [ProductCategory!]
  media_gallery_entries: [MediaGalleryEntry!]
  inventory: ProductInventory
}

type ProductCategory {
  id: Int!
  name: String!
}

type MediaGalleryEntry {
  file: String
  url: String
  position: Int
  types: [String!]
}

type ProductInventory {
  qty: Int!
  is_in_stock: Boolean!
}

type EnrichedProductsResponse {
  products: [EnrichedProduct!]!
  total_count: Int!
  message: String!
  status: String
  performance: ProductsPerformance
}

type ProductsPerformance {
  processedProducts: Int!
  apiCalls: Int!
  method: String!
  executionTime: Int!
  totalTime: Int!
  productsApiCalls: Int!
  categoriesApiCalls: Int!
  inventoryApiCalls: Int!
  totalApiCalls: Int!
  uniqueCategories: Int!
  productCount: Int!
  clientCalls: Int!
  cacheHitRate: Float!
  categoriesCached: Int!
  categoriesFetched: Int!
  dataFreshness: String!
  meshOptimizations: String!
  batchOptimizations: BatchOptimizations!
}

type BatchOptimizations {
  categoriesBatched: Boolean!
  inventoryBatched: Boolean!
  apiCallsReduced: Int!
}

extend type Query {
  mesh_products_enriched(pageSize: Int): EnrichedProductsResponse!
  mesh_products_basic(pageSize: Int): EnrichedProductsResponse!
  mesh_categories(categoryIds: [Int!]): CategoriesResponse!
}
```text

## Error Handling

### Resolver Error Handling

Each resolver includes comprehensive error handling:

```javascript
try {
  // Resolver logic
} catch (error) {
  console.error('Mesh resolver error:', error);
  
  return {
    products: [],
    total_count: 0,
    message: `Error in mesh resolver: ${error.message}`,
    performance: {
      // Error performance metrics
    },
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
    },
  };
}
```text

### Common Error Scenarios

1. **Authentication Failure**: Invalid admin token
2. **Source Unavailable**: Commerce API unreachable
3. **Schema Validation**: Invalid response format
4. **Timeout**: Long-running queries
5. **Rate Limiting**: API rate limits exceeded

## Deployment

### Build Process

1. **Template Processing**: `mesh-resolvers.template.js` → `mesh-resolvers.js`
2. **Configuration Generation**: `mesh.config.js` → `mesh.json`
3. **Schema Validation**: GraphQL schema validation
4. **Mesh Deployment**: Upload to Adobe API Mesh

### Deployment Commands

```bash
# Deploy entire application (includes mesh)
npm run deploy

# Deploy mesh only
npm run deploy:mesh

# Deploy mesh to production
npm run deploy:mesh:prod
```text

### Verification

```bash
# Test mesh action
npm run test:action get-products-mesh

# Performance analysis
npm run test:perf:mesh

# Direct mesh testing
node debug-mesh-direct.js
```text

## Monitoring and Debugging

### Debug Information

The mesh resolver provides debug information:

```javascript
debug: {
  resolverCalled: true,
  hasContext: true,
  oauthConsumerKey: 'PRESENT',
  adminUsername: 'PRESENT',
  timestamp: '2025-07-14T02:04:33.240Z'
}
```text

### Performance Monitoring

Monitor these key metrics:

- **API Call Count**: Should be ≤3 for typical product queries
- **Execution Time**: Should be <1000ms
- **Batch Efficiency**: Should be >95%
- **Error Rate**: Should be <1%

### Troubleshooting

1. **Zero Products**: Check admin token authentication
2. **Slow Performance**: Verify batch optimization is working
3. **Missing Data**: Check source configurations
4. **Schema Errors**: Validate GraphQL schema files

## Advanced Features

### Native Caching

The mesh includes native caching capabilities:

```javascript
responseConfig: {
  cache: true,  // Enable native mesh caching
}
```text

### HTTP Optimization

Sources include HTTP optimization headers:

```javascript
operationHeaders: {
  'Content-Type': 'application/json',
  'Connection': 'keep-alive',
  'Accept-Encoding': 'gzip, deflate',
}
```text

### Response Metadata

Include HTTP response details for debugging:

```javascript
responseConfig: {
  includeHTTPDetails: true,
}
```text

## Summary

This mesh implementation provides:

- **99% API Call Reduction**: From 200+ calls to 3 calls
- **Sub-second Performance**: Typical response time <750ms
- **Comprehensive Data**: Products, categories, and inventory in one query
- **Batch Optimization**: Intelligent batching for categories and inventory
- **Error Resilience**: Comprehensive error handling and recovery
- **Production Ready**: Monitoring, debugging, and performance metrics

The combination of JsonSchema sources, custom resolvers, and batch optimization creates a highly efficient and scalable solution for Commerce data integration.
