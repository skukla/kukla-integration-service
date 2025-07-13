# Adobe API Mesh Native Features Refactor Plan

## 🎯 **Objective**

Refactor our current custom mesh implementation to leverage Adobe API Mesh native capabilities, eliminating custom code where possible and maximizing the platform's built-in features for better performance, maintainability, and Adobe-native patterns.

## 🔬 **Research Findings (Updated Strategy)**

### **Phase 1: OAuth Authentication - Limited Native Support**

**Key Discovery:** Adobe Commerce requires **OAuth 1.0a** (NOT OAuth 2.0), and Adobe API Mesh lacks native OAuth 1.0a handlers.

**Adobe API Mesh Authentication Support:**

- ✅ OAuth 2.0/Bearer tokens
- ✅ Custom headers and authorization  
- ✅ Dynamic authentication via custom fetch
- ❌ **No native OAuth 1.0a with HMAC-SHA256**
- ❌ **No 2-legged OAuth handshake support**

**Revised Approach:** Simplify and streamline existing OAuth implementation rather than eliminate it.

### **Phase 2: Data Federation - Excellent Native Support**

**Key Discovery:** Adobe API Mesh has comprehensive native data federation capabilities that can replace 80-90% of our custom logic.

**Adobe API Mesh Federation Features:**

- ✅ Built on GraphQL Mesh framework with schema stitching
- ✅ Multiple source handlers (OpenAPI/Swagger, GraphQL, REST APIs)
- ✅ Automatic schema composition and type merging
- ✅ Transform system (prefix, rename, filter, encapsulate)
- ✅ Declarative JSON configuration
- ✅ Built-in batching and query optimization

**Major Opportunity:** This is where we can achieve the biggest code reduction.

### **Revised Code Reduction Estimates:**

- **Phase 1**: 60-70% reduction (simplify but can't eliminate OAuth)
- **Phase 2**: 80-90% reduction (major native federation capabilities)
- **Overall**: 70-80% total code reduction (revised from 90%)

## 📊 **Current State Analysis**

### **What We're Currently Doing (Custom Implementation)**

#### **1. Custom OAuth 1.0a Implementation (~100 lines)** ⚠️ **PARTIALLY REDUCIBLE**

- Custom `createOAuthHeader()` function with HMAC-SHA256 signatures
- Manual nonce generation and parameter encoding
- Custom credential extraction from headers
- **Updated Problem**: Adobe API Mesh lacks OAuth 1.0a support, but we can streamline our implementation

#### **2. Custom Admin Token Authentication (~70 lines)** ✅ **FULLY REPLACEABLE**

- Manual bearer token fetching via Commerce API
- Custom token management and headers
- **Problem**: Could use native authentication handlers for admin tokens

#### **3. Custom Data Consolidation (~200 lines)** ✅ **HIGHLY REPLACEABLE**

- Manual product fetching with pagination  
- Custom inventory data fetching
- Custom category data fetching
- Manual data consolidation in resolver
- **Problem**: Native schema stitching can replace this entirely

#### **4. Custom Caching Implementation (~50 lines)** ✅ **FULLY REPLACEABLE**

- Manual Map-based category caching
- Custom cache expiration logic
- **Problem**: Adobe API Mesh has native caching

#### **5. Custom Error Handling (~30 lines)** ✅ **FULLY REPLACEABLE**

- Manual try/catch blocks
- Custom error formatting
- **Problem**: Native error handling available

#### **6. Custom Performance Tracking (~80 lines)** ✅ **FULLY REPLACEABLE**

- Manual timing measurements
- Custom metrics calculation
- **Problem**: Native monitoring available

### **Updated Total: ~530 lines → ~150 lines (70-80% reduction)**

## 🏗️ **Adobe API Mesh Native Capabilities (From Audit)**

### **1. Native Authentication Handlers**

```json
{
  "sources": [
    {
      "name": "commercerest", 
      "handler": {
        "openapi": {
          "source": "...",
          "operationHeaders": {
            "Authorization": "{context.headers.authorization}"
          },
          "schemaHeaders": {
            "Authorization": "Bearer {env.COMMERCE_ADMIN_TOKEN}"
          }
        }
      }
    }
  ]
}
```

**Benefits:**

- Native OAuth 2.0, Bearer Token, API Key support
- Automatic credential management
- Built-in token refresh capabilities
- Secure credential injection from environment

### **2. Native Data Source Joining**

```json
{
  "sources": [
    {
      "name": "products",
      "handler": { "openapi": { "source": ".../products" } }
    },
    {
      "name": "inventory", 
      "handler": { "openapi": { "source": ".../inventory" } }
    },
    {
      "name": "categories",
      "handler": { "openapi": { "source": ".../categories" } }
    }
  ],
  "transforms": [
    {
      "federation": {
        "types": [
          {
            "typeName": "Product",
            "fields": [
              {
                "fieldName": "inventory",
                "selectionSet": "{ sku }",
                "computed": true
              }
            ]
          }
        ]
      }
    }
  ]
}
```

**Benefits:**

- Automatic data consolidation across sources
- Native GraphQL federation
- Declarative relationship mapping
- Optimized query planning

### **3. Native Schema Transforms**

```json
{
  "transforms": [
    {
      "rename": {
        "mode": "bare",
        "renames": [
          {
            "from": {
              "type": "ProductInterface",
              "field": "media_gallery_entries"
            },
            "to": {
              "type": "Product", 
              "field": "images"
            }
          }
        ]
      }
    },
    {
      "filterSchema": {
        "mode": "bare",
        "filters": [
          "Query.!{products, categories, inventory}",
          "Product.{sku, name, price, media_gallery_entries}"
        ]
      }
    }
  ]
}
```

**Benefits:**

- Automatic field renaming and filtering
- Schema manipulation without code
- Type safety preservation
- Optimized data transfer

### **4. Native Caching**

```json
{
  "cache": {
    "redis": {
      "host": "localhost",
      "port": 6379,
      "db": 0
    }
  },
  "sources": [
    {
      "name": "categories",
      "handler": { "..." },
      "transforms": [
        {
          "cache": [
            {
              "field": "Query.categories",
              "cacheKeyArgs": ["first", "after"],
              "ttl": 300000,
              "invalidate": {
                "ttl": 60000,
                "staleWhileRevalidate": 300000
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**Benefits:**

- Redis/memory caching out of the box
- Declarative cache invalidation
- Stale-while-revalidate patterns
- Cache key customization

### **5. Native Rate Limiting & Retry**

```json
{
  "sources": [
    {
      "name": "commerce",
      "handler": {
        "openapi": {
          "source": "...",
          "retry": {
            "maxRetries": 3,
            "retryDelay": 1000,
            "retryCondition": "5xx"
          },
          "timeout": 30000,
          "pool": {
            "maxSockets": 10
          }
        }
      }
    }
  ]
}
```

**Benefits:**

- Automatic retries with backoff
- Connection pooling
- Timeout management
- Rate limiting per source

### **6. Native Monitoring & Metrics**

```json
{
  "plugins": [
    {
      "prometheus": {
        "endpoint": "/metrics",
        "registry": "default"
      }
    },
    {
      "responseCache": {
        "ttl": 300000,
        "includeExtensionMetadata": true
      }
    }
  ]
}
```

**Benefits:**

- Prometheus metrics out of the box
- Query performance tracking
- Cache hit/miss metrics
- Error rate monitoring

## 🚀 **Refactor Implementation Plan**

### **Phase 1: Native Authentication Migration**

#### **1.1 Replace OAuth 1.0a Custom Implementation**

```json
{
  "sources": [
    {
      "name": "commercerest",
      "handler": {
        "openapi": {
          "source": "https://citisignal-com774.adobedemo.com/rest/all/schema?services=all",
          "operationHeaders": {
            "Authorization": "OAuth oauth_consumer_key=\"{env.COMMERCE_CONSUMER_KEY}\", oauth_token=\"{env.COMMERCE_ACCESS_TOKEN}\", oauth_signature_method=\"HMAC-SHA256\", oauth_timestamp=\"{context.timestamp}\", oauth_nonce=\"{context.nonce}\", oauth_version=\"1.0\", oauth_signature=\"{context.signature}\""
          }
        }
      }
    }
  ]
}
```

**Actions:**

- [ ] Remove custom OAuth functions (~100 lines)
- [ ] Configure native OAuth in mesh.json
- [ ] Test authentication with native handler
- [ ] Update mesh-resolvers.template.js to remove OAuth code

#### **1.2 Admin Token Authentication**

```json
{
  "sources": [
    {
      "name": "commerceadmin", 
      "handler": {
        "openapi": {
          "source": "...",
          "operationHeaders": {
            "Authorization": "Bearer {env.COMMERCE_ADMIN_TOKEN}"
          }
        }
      }
    }
  ]
}
```

**Actions:**

- [ ] Remove custom `getAdminToken()` function (~70 lines)
- [ ] Configure bearer token in environment
- [ ] Update inventory fetching to use native auth

### **Phase 2: Native Data Source Architecture**

#### **2.1 Split Single Source into Multiple Sources**

```json
{
  "sources": [
    {
      "name": "products",
      "handler": {
        "openapi": {
          "source": "https://citisignal-com774.adobedemo.com/rest/V1/products",
          "operationHeaders": {
            "Authorization": "OAuth ..."
          }
        }
      }
    },
    {
      "name": "inventory",
      "handler": {
        "openapi": {
          "source": "https://citisignal-com774.adobedemo.com/rest/V1/stockItems",
          "operationHeaders": {
            "Authorization": "Bearer {env.COMMERCE_ADMIN_TOKEN}"
          }
        }
      }
    },
    {
      "name": "categories",
      "handler": {
        "openapi": {
          "source": "https://citisignal-com774.adobedemo.com/rest/V1/categories",
          "operationHeaders": {
            "Authorization": "OAuth ..."
          }
        }
      }
    }
  ]
}
```

**Actions:**

- [ ] Split current single source into three focused sources
- [ ] Configure appropriate authentication per source
- [ ] Test individual source functionality

#### **2.2 Native Data Federation**

```json
{
  "transforms": [
    {
      "federation": {
        "types": [
          {
            "typeName": "Product",
            "keyFields": ["sku"],
            "fields": [
              {
                "fieldName": "inventory",
                "selectionSet": "{ sku }",
                "type": "Inventory",
                "resolver": "inventory.getInventoryBySku"
              },
              {
                "fieldName": "categories",
                "selectionSet": "{ category_ids }",
                "type": "[Category]",
                "resolver": "categories.getCategoriesByIds"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

**Actions:**

- [ ] Remove custom data consolidation (~200 lines)
- [ ] Configure native federation
- [ ] Test automated data joining
- [ ] Verify performance vs custom implementation

### **Phase 3: Native Schema & Transform Optimization**

#### **3.1 Field Filtering & Renaming**

```json
{
  "transforms": [
    {
      "filterSchema": {
        "mode": "bare",
        "filters": [
          "Product.{sku, name, price, media_gallery_entries, category_ids}",
          "Query.{products}"
        ]
      }
    },
    {
      "rename": {
        "mode": "bare", 
        "renames": [
          {
            "from": {
              "type": "Product",
              "field": "media_gallery_entries"
            },
            "to": {
              "type": "Product",
              "field": "images"
            }
          }
        ]
      }
    }
  ]
}
```

**Actions:**

- [ ] Move field filtering from code to native transforms
- [ ] Configure schema renaming for cleaner API
- [ ] Remove custom field processing logic

#### **3.2 Native Type Definitions**

```json
{
  "additionalTypeDefs": [
    "extend type Product { enrichedData: EnrichedProductData }",
    "type EnrichedProductData { inventory: ProductInventory categories: [ProductCategory] images: [ProductImage] }"
  ]
}
```

**Actions:**

- [ ] Simplify custom type definitions
- [ ] Let native federation handle relationships
- [ ] Remove redundant type complexity

### **Phase 4: Native Caching & Performance**

#### **4.1 Native Caching Configuration**

```json
{
  "cache": {
    "redis": {
      "host": "{env.REDIS_HOST}",
      "port": 6379,
      "password": "{env.REDIS_PASSWORD}"
    }
  },
  "transforms": [
    {
      "cache": [
        {
          "field": "Query.categories",
          "cacheKeyArgs": ["ids"],
          "ttl": 300000,
          "invalidate": {
            "ttl": 60000,
            "staleWhileRevalidate": 300000
          }
        }
      ]
    }
  ]
}
```

**Actions:**

- [ ] Remove custom Map-based caching (~50 lines)
- [ ] Configure Redis for production caching
- [ ] Set up cache invalidation strategies
- [ ] Test cache performance vs custom implementation

#### **4.2 Native Performance Monitoring**

```json
{
  "plugins": [
    {
      "prometheus": {
        "endpoint": "/metrics",
        "registry": "default",
        "labels": {
          "service": "commerce-mesh"
        }
      }
    }
  ]
}
```

**Actions:**

- [ ] Remove custom performance tracking (~80 lines)
- [ ] Configure native monitoring
- [ ] Set up Prometheus metrics collection
- [ ] Create performance dashboards

### **Phase 5: Simplified Custom Resolvers**

#### **5.1 Minimal Business Logic Only**

```javascript
// Simplified mesh-resolvers.js (target: ~50 lines vs current ~530 lines)
module.exports = {
  resolvers: {
    Query: {
      enrichedProducts: {
        resolve: async (parent, args, context, info) => {
          // Only business logic that can't be handled natively
          const products = await context.commerceProducts.getProducts(args);
          
          // Native federation handles inventory and categories automatically
          return {
            products,
            total_count: products.length,
            message: 'Products enriched via native mesh features',
            status: 'success'
          };
        }
      }
    }
  }
};
```

**Actions:**

- [ ] Reduce resolver to minimal business logic only
- [ ] Remove all authentication, caching, data fetching code
- [ ] Let native features handle infrastructure concerns
- [ ] Focus resolvers on domain-specific transformations only

## 📋 **Implementation Phases & Timeline (Research-Based Strategy)**

### **Phase 1: Data Federation (Week 1) - BIGGEST WINS** 🎯

**Priority: HIGH** - 80-90% code reduction opportunity

- [ ] Day 1-2: Configure multiple Commerce API sources (products, categories, inventory)
- [ ] Day 3-4: Set up native schema stitching and federation
- [ ] Day 5: Test automated data consolidation and remove ~200 lines of custom logic

### **Phase 2: Native Infrastructure (Week 2)**

**Priority: HIGH** - Leverage native platform features  

- [ ] Day 1-2: Configure native caching (replace ~50 lines)
- [ ] Day 3-4: Set up native error handling and monitoring (~110 lines)
- [ ] Day 5: Test and validate infrastructure improvements

### **Phase 3: Schema Optimization (Week 3)**

**Priority: MEDIUM** - Clean up and optimize

- [ ] Day 1-2: Configure native transforms for field renaming/filtering
- [ ] Day 3-4: Simplify type definitions and remove custom transforms
- [ ] Day 5: Test schema transformations and performance

### **Phase 4: Authentication Streamlining (Week 4)**

**Priority: MEDIUM** - Simplify but keep necessary OAuth 1.0a

- [ ] Day 1-2: Streamline OAuth 1.0a implementation (reduce ~30-40 lines)
- [ ] Day 3-4: Optimize admin token handling where possible
- [ ] Day 5: Test authentication flow and error handling

### **Phase 5: Final Cleanup (Week 5)**

**Priority: LOW** - Polish and document

- [ ] Day 1-2: Simplify remaining custom resolvers to minimal business logic
- [ ] Day 3-4: Remove unnecessary code, update documentation
- [ ] Day 5: Final testing and performance validation

## 🎯 **Success Metrics (Research-Updated)**

### **Code Reduction**

- **Target**: Reduce custom mesh code from ~530 lines to ~150 lines (70-80% reduction)
- **Measure**: Lines of code in mesh-resolvers.js and mesh.json complexity
- **Phase 1 Target**: Remove ~200 lines of data consolidation logic
- **Phase 2 Target**: Remove ~160 lines of infrastructure code

### **Performance Improvement**

- **Target**: Maintain or improve current 200+ API call consolidation
- **Target**: Reduce response times through native optimizations
- **Measure**: Query execution time, cache hit rates, API call count

### **Maintainability**

- **Target**: Eliminate custom infrastructure code
- **Target**: Use Adobe-native patterns for better support
- **Measure**: Code complexity, developer onboarding time

### **Reliability**

- **Target**: Leverage Adobe's battle-tested native features
- **Target**: Improve error handling and retry logic
- **Measure**: Error rates, uptime, recovery patterns

## 🔒 **Authentication Considerations**

### **Dual Authentication Challenge**

Our audit revealed we need **both** OAuth 1.0 and Admin Token authentication:

- **OAuth 1.0**: For products and categories (Commerce REST API)
- **Admin Token**: For inventory data (requires admin privileges)

### **Native Solution Strategy**

```json
{
  "sources": [
    {
      "name": "commerceOAuth",
      "handler": {
        "openapi": {
          "source": "commerce/products",
          "operationHeaders": {
            "Authorization": "OAuth {oauth.generateHeader}"
          }
        }
      }
    },
    {
      "name": "commerceAdmin", 
      "handler": {
        "openapi": {
          "source": "commerce/inventory",
          "operationHeaders": {
            "Authorization": "Bearer {env.COMMERCE_ADMIN_TOKEN}"
          }
        }
      }
    }
  ]
}
```

**Benefits:**

- Each source uses appropriate authentication
- Native credential management
- No custom authentication code needed

## 🏛️ **Architecture Standards Compliance**

### **Refactoring Standards Alignment**

- ✅ **DRY Principle**: Eliminate custom code duplication with native features
- ✅ **Single Responsibility**: Each source handles one data type
- ✅ **Configuration-Driven**: Move logic to declarative configuration
- ✅ **Performance First**: Leverage Adobe's optimized native features

### **Code Standards Alignment**

- ✅ **Function Length**: Target ~10-line resolvers vs current ~50-line functions
- ✅ **Complexity Reduction**: Remove nested authentication and caching logic
- ✅ **Error Handling**: Use native error propagation and formatting
- ✅ **Documentation**: Focus on business logic documentation only

### **Architecture Standards Alignment**

- ✅ **Domain Separation**: Authentication, caching, monitoring as native concerns
- ✅ **Light DDD**: Resolvers focus only on domain logic
- ✅ **Functional Composition**: Use native transforms for data manipulation
- ✅ **Adobe Patterns**: Follow Adobe API Mesh best practices

## 📚 **Documentation Requirements**

### **Create New Documentation**

- [ ] `docs/development/mesh-native-features.md` - Native features usage guide
- [ ] `docs/architecture/mesh-native-architecture.md` - Updated architecture documentation
- [ ] `docs/deployment/mesh-native-configuration.md` - Configuration management guide

### **Update Existing Documentation**

- [ ] Update `.cursorrules` with native mesh patterns
- [ ] Update `docs/development/api-mesh-integration.md`
- [ ] Update architecture migration documentation

## 🧪 **Testing Strategy**

### **Compatibility Testing**

- [ ] Ensure identical CSV output vs current implementation
- [ ] Validate same performance or better
- [ ] Test all authentication scenarios

### **Performance Testing**  

- [ ] Benchmark native caching vs custom Map cache
- [ ] Test native federation vs custom data consolidation
- [ ] Measure query execution times

### **Integration Testing**

- [ ] Test with existing App Builder actions
- [ ] Validate buildProducts step still works
- [ ] Ensure storage and CSV generation unchanged

## 💡 **Risk Mitigation**

### **Backward Compatibility**

- Keep existing `get-products-mesh` action unchanged during migration
- Create new `get-products-native` action for testing
- Only switch over after full validation

### **Rollback Strategy**

- Maintain current implementation in separate branch
- Document rollback procedure
- Keep performance baselines for comparison

### **Feature Parity**

- Document all current custom features
- Ensure native alternatives exist for each
- Test edge cases and error scenarios

## 🎉 **Expected Outcomes**

After completing this refactor:

1. **90% Code Reduction**: From ~530 lines to ~50 lines of custom mesh code
2. **Adobe-Native Patterns**: Using official API Mesh features vs custom implementations  
3. **Better Performance**: Leveraging Adobe's optimized native caching, authentication, and data federation
4. **Improved Maintainability**: Less custom code means fewer bugs and easier updates
5. **Enhanced Monitoring**: Native Prometheus metrics and monitoring capabilities
6. **Future-Proof Architecture**: Using supported Adobe features vs custom implementations

This refactor will position us to leverage Adobe API Mesh as intended - as a powerful native platform rather than a custom code hosting environment.

# Realistic Adobe API Mesh Integration Plan

**Updated Plan**: Use actual Adobe API Mesh capabilities to optimize working custom resolvers, not replace them with theoretical features.

## Current Reality Check

### ✅ What Adobe API Mesh Actually Supports

- **OpenAPI/GraphQL Sources**: Multiple Commerce API endpoints
- **Simple Transforms**: Field filtering, renaming, prefixes  
- **Basic Caching**: `"cache": true/false` (simple boolean only)
- **Custom Resolvers**: JavaScript functions with network access
- **Authentication**: Bearer tokens via `operationHeaders`
- **Source Composition**: Multiple APIs in single schema

### ❌ What Adobe API Mesh Does NOT Support

- `context.injector.get('GraphQLExecutor')` - This API doesn't exist
- Prometheus metrics integration - Not available
- Redis configuration - Not supported (only internal caching)
- Federation like Apollo Federation - Limited support
- Advanced schema stitching - Basic composition only

## Realistic Implementation Strategy

### Phase 2A: Source Optimization (Current Priority)

**Goal**: Use multiple focused Commerce API sources to reduce custom resolver complexity

#### Current Custom Resolver Issues

```javascript
// ❌ Custom resolver does everything manually (598 lines)
- Fetch products from /rest/V1/products
- Fetch inventory for each SKU from /rest/V1/stockItems/{sku}
- Fetch categories from /rest/V1/categories/{id}
- Manual OAuth for each call
- Manual parallel processing
- Manual error handling
```

#### Phase 2A Solution: Multiple Specialized Sources

```javascript
// ✅ Let Adobe API Mesh handle source management
{
  "sources": [
    {
      "name": "products",
      "handler": {
        "openapi": {
          "source": "https://commerce.example.com/rest/all/schema?services=catalogProductRepositoryV1",
          "operationHeaders": {
            "Authorization": "Bearer {context.headers.x-commerce-admin-token}"
          }
        }
      }
    },
    {
      "name": "inventory", 
      "handler": {
        "openapi": {
          "source": "https://commerce.example.com/rest/all/schema?services=catalogInventoryStockRegistryV1",
          "operationHeaders": {
            "Authorization": "Bearer {context.headers.x-commerce-admin-token}"
          }
        }
      }
    },
    {
      "name": "categories",
      "handler": {
        "openapi": {
          "source": "https://commerce.example.com/rest/all/schema?services=catalogCategoryRepositoryV1", 
          "operationHeaders": {
            "Authorization": "Bearer {context.headers.x-commerce-admin-token}"
          }
        }
      }
    }
  ]
}
```

#### Phase 2A Benefits

- **Source Authentication**: Let Adobe API Mesh handle auth headers for each source
- **Schema Generation**: Auto-generated GraphQL types from OpenAPI schemas
- **Built-in Error Handling**: Basic retry and timeout handling per source
- **Reduced Resolver Code**: ~30% reduction by eliminating manual source management

### Phase 2B: Transform Optimization

**Goal**: Use native transforms to reduce custom field processing

#### Current Custom Field Processing

```javascript
// ❌ Manual field transformation (50+ lines)
const enrichedProduct = {
  sku: product.sku,
  name: product.name,
  price: product.price,
  qty: inventory[product.sku]?.qty || 0,
  categories: product.category_links?.map(link => categories[link.category_id])
    .filter(Boolean)
    .map(cat => ({ id: cat.id, name: cat.name })),
  images: product.media_gallery_entries?.map(transformImageEntry) || []
};
```

#### Phase 2B Solution: Native Field Transforms

```javascript
// ✅ Let Adobe API Mesh handle field mapping
{
  "transforms": [
    {
      "rename": {
        "mode": "bare",
        "renames": [
          {
            "from": {
              "type": "Product",
              "field": "media_gallery_entries"
            },
            "to": {
              "type": "Product", 
              "field": "images"
            }
          }
        ]
      }
    },
    {
      "filterSchema": {
        "mode": "bare",
        "filters": [
          "Product.sku",
          "Product.name", 
          "Product.price",
          "Product.images",
          "Product.category_links"
        ]
      }
    }
  ]
}
```

#### Phase 2B Benefits

- **Field Optimization**: Only fetch needed fields, reducing payload by ~50%
- **Automatic Transforms**: Rename fields without custom code
- **Type Safety**: Preserved through native schema manipulation

### Phase 2C: Keep Working Performance Metrics

**Goal**: Preserve detailed performance tracking that frontend expects

#### Keep Custom Performance Logic

```javascript
// ✅ Keep working performance metrics (required by frontend)
function initializePerformanceTracking() {
  return {
    processedProducts: 0,
    apiCalls: 0,
    method: 'API Mesh (Optimized)',
    executionTime: 0,
    totalTime: '',
    productFetch: '',
    dataExtraction: '',
    parallelFetch: '', 
    dataEnrichment: '',
    productsApiCalls: 0,
    categoriesApiCalls: 0,
    inventoryApiCalls: 0,
    totalApiCalls: 0,
    uniqueCategories: 0,
    productCount: 0,
    skuCount: 0,
    clientCalls: 1,
    dataSourcesUnified: 3,
    queryConsolidation: '1:1',
    cacheHitRate: 0,
    categoriesCached: 0,
    categoriesFetched: 0,
    operationComplexity: 'optimized-sources',
    dataFreshness: 'real-time',
    clientComplexity: 'minimal',
    apiOrchestration: 'mesh-managed',
    parallelization: 'automatic',
    meshOptimizations: ['Multi-Source', 'Native Transforms', 'Auto-Auth']
  };
}
```

## Implementation Plan

### Week 1: Phase 2A - Source Optimization

- [ ] Day 1-2: Configure multiple specialized Commerce API sources
- [ ] Day 3-4: Update custom resolver to use `context.products`, `context.inventory`, `context.categories`
- [ ] Day 5: Test source-optimized resolver, verify performance metrics preserved

### Week 2: Phase 2B - Transform Optimization  

- [ ] Day 1-2: Add native field filtering transforms
- [ ] Day 3-4: Add native field renaming transforms
- [ ] Day 5: Performance test and optimization

### Week 3: Phase 2C - Final Cleanup

- [ ] Day 1-2: Clean up unnecessary custom code (auth, source management)
- [ ] Day 3-4: Update documentation and standards
- [ ] Day 5: Deploy and validate identical CSV output

## Expected Results

### Code Reduction

- **Before**: 598 lines of custom resolver
- **After**: ~400 lines (33% reduction through source and transform optimization)
- **Preserved**: All performance metrics, inventory data, frontend compatibility

### Performance Improvement

- **Source Management**: Eliminated custom auth and source setup (~50 lines)
- **Field Processing**: Reduced payload size through native filtering
- **Error Handling**: Basic retry/timeout handled by Adobe API Mesh per source

### Maintainability

- **Authentication**: Handled by Adobe API Mesh source configuration
- **Schema Types**: Auto-generated from OpenAPI schemas
- **Field Transforms**: Declarative configuration instead of custom code

## Why This Approach Works

1. **Realistic**: Uses only documented Adobe API Mesh features
2. **Preserves Functionality**: Keeps working performance metrics and data enrichment
3. **Incremental**: Can be implemented step-by-step without breaking changes
4. **Performance**: Reduces custom code while maintaining optimization
5. **Frontend Compatible**: Preserves exact data structure frontend expects

## Phase 3: Custom TypeDefs Documentation

Document when custom GraphQL types are needed:

```javascript
// Required for performance metrics (25+ fields)
"type ProductsPerformance { processedProducts: Int apiCalls: Int method: String ... }"

// Required for enriched product structure
"type EnrichedProduct { sku: String name: String price: Float qty: Float categories: [ProductCategory] images: [ProductImage] inventory: ProductInventory }"

// Required for complex response structure  
"extend type Query { mesh_products_enriched(pageSize: Int maxPages: Int): EnrichedProductsResponse }"
```

These custom types are **necessary** because:

1. Performance metrics aren't in Commerce OpenAPI schema
2. Enriched product structure combines multiple API responses
3. Custom resolver returns data not directly from any single Commerce API
