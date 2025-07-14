# Adobe API Mesh Native Features Refactor Plan V2

## **From Custom Resolver to Native Mesh Architecture**

### 🎯 **Mission: True Native Mesh Implementation**

**✅ BASELINE ACHIEVED:**

- Working custom resolver proves OAuth + admin token authentication viable
- 119 products successfully processed with Web Crypto API
- Single GraphQL query consolidating 200+ REST API calls
- **BUT**: Everything is crammed into one custom resolver instead of using native mesh features

**🔄 REFACTOR GOAL:**
Transform from **"everything in custom resolver"** to **"native mesh features with minimal custom code"**

---

## 🏗️ **Architecture Transformation**

### **Current State: Monolithic Custom Resolver**

```javascript
// Single custom resolver doing everything
mesh_products_enriched: {
  resolve: async (parent, args, context) => {
    // ❌ Manual OAuth implementation
    // ❌ Manual Commerce API calls  
    // ❌ Manual data consolidation
    // ❌ Manual caching
    // ❌ Admin credentials via GraphQL variables (SECURITY ISSUE!)
  }
}
```

### **Target State: Native Mesh Architecture**

```yaml
# Multiple native sources with built-in capabilities
sources:
  - name: commerceProducts
    handler: 
      openapi:
        source: commerce/products
        operationHeaders:
          Authorization: "OAuth {env.OAUTH_HEADER}"
  
  - name: commerceCategories  
    handler:
      openapi:
        source: commerce/categories
        operationHeaders:
          Authorization: "Bearer {env.ADMIN_TOKEN}"

  - name: commerceInventory
    handler:
      openapi:
        source: commerce/inventory  
        operationHeaders:
          Authorization: "Bearer {env.ADMIN_TOKEN}"

transforms:
  - filterSchema:
      mode: wrap
  - rename:
      mode: wrap
      
additionalResolvers: "./minimal-resolvers.js"  # Only business logic
```

---

## 🔄 **Refactor Phases: Native Feature Migration**

### **Phase 1: Security & Authentication Migration** 🔐

*Duration: 2-3 days*

**Objectives:**

- ✅ **Fix security issue**: Remove admin credentials from GraphQL variables
- ✅ **Native authentication**: Use Adobe API Mesh auth handlers
- ✅ **Environment variables**: Secure credential management

**Tasks:**

- [ ] **Security Fix: Remove Insecure Credential Passing**
  - Remove `adminUsername`/`adminPassword` from GraphQL variables
  - Move all credentials to environment variables
  - Update action parameter passing to use headers only

- [ ] **Native OAuth Configuration**
  - Research Adobe API Mesh OAuth 1.0 support capabilities
  - Configure OAuth credentials via environment variables
  - Test native OAuth header generation vs custom Web Crypto

- [ ] **Admin Token Environment Setup**
  - Move admin credentials to secure environment variables  
  - Configure admin token generation via native handlers
  - Remove credential passing through GraphQL context

**Success Criteria:**

- No credentials passed via GraphQL variables
- All authentication via environment variables
- Native auth handlers working (or documented limitations)

### **Phase 2: Multi-Source Architecture** 🌐

*Duration: 3-4 days*

**Objectives:**

- ✅ **Split monolithic resolver**: Separate concerns into multiple sources
- ✅ **Native data sources**: Products, Categories, Inventory as separate sources
- ✅ **Schema composition**: Let Adobe API Mesh handle data combination

**Tasks:**

- [ ] **Products Source Configuration**

  ```yaml
  - name: commerceProducts
    handler:
      openapi:
        source: "https://citisignal-com774.adobedemo.com/rest/all/schema"
        operationHeaders:
          Authorization: "OAuth {oauth.header}"
  ```

- [ ] **Categories Source Configuration**  

  ```yaml
  - name: commerceCategories
    handler:
      openapi:
        source: "https://citisignal-com774.adobedemo.com/rest/all/schema"
        operationHeaders:
          Authorization: "Bearer {env.ADMIN_TOKEN}"
  ```

- [ ] **Inventory Source Configuration**

  ```yaml
  - name: commerceInventory  
    handler:
      openapi:
        source: "https://citisignal-com774.adobedemo.com/rest/all/schema"
        operationHeaders:
          Authorization: "Bearer {env.ADMIN_TOKEN}"
  ```

- [ ] **Remove Custom Data Fetching**
  - Replace manual `fetchAllProducts()` with native source queries
  - Replace manual `fetchCategoriesData()` with native source queries  
  - Replace manual `fetchInventoryData()` with native source queries

**Success Criteria:**

- Three separate native data sources working
- No custom Commerce API calls in resolvers
- Native schema composition providing unified interface

### **Phase 3: Native Data Federation** 🔗

*Duration: 2-3 days*

**Objectives:**

- ✅ **Schema stitching**: Replace manual data consolidation with native features
- ✅ **Transforms**: Use native transform system for data shaping
- ✅ **Field selection**: Native GraphQL field filtering

**Tasks:**

- [ ] **Schema Stitching Configuration**

  ```yaml
  additionalTypeDefs: |
    extend type Query {
      enrichedProducts(pageSize: Int): [EnrichedProduct]
    }
    
    type EnrichedProduct {
      # Auto-stitched from multiple sources
      sku: String
      name: String  
      categories: [Category]
      inventory: Inventory
    }
  ```

- [ ] **Native Transform Implementation**

  ```yaml
  transforms:
    - rename:
        mode: wrap
        renames:
          - from:
              type: "Product"
              field: "custom_attributes"
            to:
              type: "Product" 
              field: "attributes"
  ```

- [ ] **Minimal Custom Resolvers**

  ```javascript
  // Only business logic, not data fetching
  module.exports = {
    resolvers: {
      EnrichedProduct: {
        categories: (parent) => {
          // Simple field mapping, not API calls
          return parent.category_ids?.map(id => ({ id }));
        }
      }
    }
  };
  ```

**Success Criteria:**

- Data consolidation handled by native schema stitching
- Transforms handle data shaping automatically
- Custom resolvers only contain pure business logic (no API calls)

### **Phase 4: Advanced Native Features** 🚀

*Duration: 2-3 days*

**Objectives:**

- ✅ **Native caching**: Replace manual category caching
- ✅ **Rate limiting**: Built-in Commerce API protection
- ✅ **Error handling**: Native retry and circuit breaker patterns

**Tasks:**

- [ ] **Native Caching Strategy**

  ```yaml
  cache:
    - field: "Query.categories"
      cacheKeyArgs: ["id"]
      ttl: 300  # 5 minutes
    - field: "Query.products"  
      cacheKeyArgs: ["pageSize", "currentPage"]
      ttl: 60   # 1 minute
  ```

- [ ] **Rate Limiting Configuration**

  ```yaml
  rateLimitConfig:
    - sourcePattern: "commerceProducts"
      max: 100
      window: "1m"
    - sourcePattern: "commerceInventory"
      max: 50
      window: "1m"
  ```

- [ ] **Native Error Handling**

  ```yaml
  retry:
    retries: 3
    retryDelay: 1000
    retryOn:
      - NETWORK_ERROR
      - TIMEOUT_ERROR
  ```

**Success Criteria:**

- No manual caching code in resolvers
- Commerce API protected by native rate limiting  
- Error handling and retries managed by platform

---

## 🎯 **Success Metrics by Phase**

### **Phase 1 Targets:**

- ✅ **Security**: Zero credentials in GraphQL variables
- ✅ **Authentication**: Native auth handlers configured
- ✅ **Environment**: All credentials in environment variables

### **Phase 2 Targets:**  

- ✅ **Sources**: 3 separate native data sources
- ✅ **Code Reduction**: 80% reduction in custom resolver code
- ✅ **Performance**: Same 119 products, faster response time

### **Phase 3 Targets:**

- ✅ **Native Federation**: Schema stitching replaces manual consolidation
- ✅ **Transforms**: Native data shaping replaces custom JavaScript
- ✅ **Resolver Size**: <50 lines of pure business logic

### **Phase 4 Targets:**

- ✅ **Zero Manual Infrastructure**: No custom caching, rate limiting, retries
- ✅ **Platform Features**: 100% native Adobe API Mesh capabilities
- ✅ **Maintainability**: Business logic only, platform handles infrastructure

---

## 🔍 **Native Feature Research Priorities**

### **Research Findings: Native Capabilities Assessment**

✅ **CONFIRMED LIMITATIONS:**

1. **OAuth 1.0 Native Support**: ❌ **Not available** - Adobe API Mesh lacks native OAuth 1.0 handlers
2. **Commerce API Compatibility**: ✅ **Limited** - OpenAPI sources possible but may require custom auth
3. **Dynamic Authentication**: ⚠️ **Workaround needed** - Environment variables + custom auth logic
4. **Schema Discovery**: ✅ **Available** - GraphQL schema stitching works well

### **Realistic Refactor Strategy:**

- **Keep custom OAuth**: Minimal Web Crypto API implementation (can't eliminate)
- **Use native sources**: HTTP/OpenAPI sources with custom auth headers
- **Leverage schema stitching**: Replace manual data consolidation with native federation
- **Adopt native transforms**: Use built-in data transformation capabilities
- **Implement native caching**: Replace manual Map-based caching with platform features

---

## 🚨 **Security Improvements**

### **Current Security Issues:**

- ❌ Admin credentials passed via GraphQL variables (visible in queries)
- ❌ Credentials potentially logged in mesh resolver logs
- ❌ No credential rotation capability

### **Target Security Model:**

- ✅ All credentials in environment variables only
- ✅ Native authentication handlers with credential isolation
- ✅ No credentials in GraphQL queries or resolver code
- ✅ Audit trail for Commerce API access

---

## 📝 **Implementation Strategy**

### **Incremental Migration Approach:**

1. **Parallel Implementation**: Build native sources alongside existing custom resolver
2. **A/B Testing**: Compare native vs custom resolver performance
3. **Gradual Cutover**: Source by source migration (Products → Categories → Inventory)
4. **Rollback Plan**: Keep custom resolver as fallback during migration

### **Risk Mitigation:**

- **Maintain baseline**: Never break the working 119 product output
- **Performance monitoring**: Track response times through migration
- **Security validation**: Audit credential handling at each phase
- **Documentation**: Record native feature limitations discovered

---

## 🚀 **Expected Outcomes**

### **Code Reduction:**

- **Before**: ~800 lines of custom resolver code
- **After**: ~50 lines of business logic + native configuration

### **Architecture Benefits:**

- **Maintainability**: Platform handles infrastructure concerns
- **Security**: Native credential management
- **Performance**: Built-in caching, rate limiting, retry logic
- **Scalability**: Adobe's optimized data federation

### **Platform Alignment:**

- **Adobe Best Practices**: Using mesh as intended
- **Future-Proof**: Automatic platform improvements benefit us
- **Support**: Adobe support for native features vs custom code

---

*This refactor plan prioritizes the original goal: maximum use of native Adobe API Mesh features with minimal custom code, while addressing security concerns and maintaining proven functionality.*
