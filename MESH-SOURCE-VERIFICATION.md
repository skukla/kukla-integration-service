# Adobe API Mesh Multi-Source Verification Guide

## Overview

This guide provides multiple methods to verify that our Phase 2 multi-source architecture is working correctly and that our OpenAPI handlers are actually being used by Adobe API Mesh.

## ✅ Configuration Validation

### Multi-Source Pattern ✓ CONFIRMED VALID

Our configuration using **the same OpenAPI URL for multiple sources is completely valid** according to Adobe documentation:

```javascript
// ✅ VALID: Multiple sources pointing to same OpenAPI endpoint
sources: [
  { name: 'commerceProducts', handler: { openapi: { source: 'same-url' }}},
  { name: 'commerceInventory', handler: { openapi: { source: 'same-url' }}},
  { name: 'commerceCategories', handler: { openapi: { source: 'same-url' }}},
]
```

**Benefits:**

- Different authentication methods per source
- Organized via prefixes (`Products_`, `Inventory_`, `Categories_`)
- Source isolation for better debugging
- Follows Adobe's documented multi-source patterns

## 🔍 Verification Methods

### Method 1: Automated Verification Script

Run our comprehensive verification script:

```bash
npm run verify:mesh
```

**What it tests:**

- ✅ GraphQL introspection for prefixed operations
- ✅ Source availability (`Products_`, `Inventory_`, `Categories_`)
- ✅ Authentication handling across sources
- ✅ Custom resolver functionality

### Method 2: Manual GraphQL Introspection

Test directly via GraphQL to see available operations:

```bash
# Using curl to test introspection
curl -X POST "https://graph.adobe.io/api/your-mesh-id/graphql" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "query": "query { __schema { queryType { fields { name } } } }"
  }' | jq '.data.__schema.queryType.fields[] | select(.name | startswith("Products_", "Inventory_", "Categories_"))'
```

**Expected results:**

- Multiple operations starting with `Products_`
- Multiple operations starting with `Inventory_`
- Multiple operations starting with `Categories_`

### Method 3: Test Individual Source Operations

Test that prefixed operations work independently:

```graphql
# Test Products source (OAuth 1.0)
query TestProductsSource {
  Products_rest_all_V1_products_get(
    searchCriteria: { pageSize: 1 }
  ) {
    items {
      sku
      name
    }
  }
}

# Test Inventory source (Admin Token)
query TestInventorySource {
  Inventory_rest_all_V1_stockItems_sku_get(sku: "TEST_SKU") {
    qty
    is_in_stock
  }
}
```

### Method 4: Check Generated Schema Files

Verify that multiple sources are generated in the mesh build:

```bash
# After mesh deployment, check for source-specific schema files
ls -la .mesh/sources/

# Expected output:
# commerceProducts/
# commerceInventory/
# commerceCategories/
# commercerest/  (legacy)
```

### Method 5: Monitor Network Requests

Use browser dev tools or logging to verify API calls:

```javascript
// In browser console during mesh query execution
// Check Network tab for multiple parallel requests to:
// - Commerce Products API (OAuth signatures)
// - Commerce Inventory API (Admin token headers)
// - Commerce Categories API (OAuth signatures)
```

## 🚨 Troubleshooting Signs of Problems

### Sources NOT Working (Bad Signs)

❌ **Schema introspection shows no prefixed operations**

```bash
# If this returns empty, sources aren't working:
npm run verify:mesh | grep "operations found"
```

❌ **Only legacy operations available**

```graphql
query CheckLegacyOnly {
  __schema {
    queryType {
      fields {
        name
      }
    }
  }
}
# Should NOT only show unprefixed operations
```

❌ **Authentication errors on specific sources**

```bash
# Custom resolver fails with auth errors:
curl ... -d '{"query": "{ mesh_products_enriched { products { sku } } }"}' 
# 401 Unauthorized suggests source auth issues
```

### Sources Working Correctly (Good Signs)

✅ **Multiple prefixed operations available**

```bash
npm run verify:mesh
# Should show: "Products_ source: 50+ operations found"
```

✅ **Source isolation working**

```bash
# Different auth methods per source prefix
# Products_: OAuth 1.0 signatures
# Inventory_: Admin token headers
```

✅ **Performance metrics show multiple API calls**

```json
{
  "performance": {
    "totalTime": "1.2s",
    "totalApiCalls": 15,
    "productsApiCalls": 8,
    "categoriesApiCalls": 4,
    "inventoryApiCalls": 3,
    "method": "mesh"
  }
}
```

## 🔧 Debug Commands

### Check Mesh Configuration

```bash
# Verify mesh.json has multiple sources
cat mesh.json | jq '.meshConfig.sources[] | .name'

# Expected output:
# "commerceProducts"
# "commerceInventory" 
# "commerceCategories"
# "commercerest"
```

### Test Source Authentication

```bash
# Test OAuth 1.0 for Products source
npm run test:action get-products-mesh

# Check logs for authentication success
aio rt activation logs --last
```

### Verify Source URLs

```bash
# All sources should point to same OpenAPI spec
cat mesh.config.js | grep -A 2 "source:"

# Expected: All pointing to same Commerce OpenAPI URL
```

## 📊 Performance Verification

### Source Performance Comparison

```bash
# Compare single-source vs multi-source performance
npm run test:perf:mesh

# Should show performance breakdown by source
# Indicates sources are working independently
```

## 🎯 Success Criteria

Our multi-source OpenAPI handlers are working correctly when:

1. ✅ **GraphQL introspection** shows 50+ operations with each prefix
2. ✅ **Authentication isolation** works (OAuth vs Admin Token)
3. ✅ **Source performance tracking** shows individual source timing
4. ✅ **Error isolation** - failures in one source don't break others
5. ✅ **Prefix transforms** properly namespace operations
6. ✅ **Custom resolver** can query all sources simultaneously

## 🚀 Next Steps After Verification

Once sources are verified working:

1. **Performance optimization** - tune source-specific settings
2. **Error handling** - implement source-specific error recovery  
3. **Caching strategy** - configure per-source caching
4. **Monitoring** - set up source-specific alerts

## 📝 Documentation References

- [Adobe API Mesh Multi-Source Documentation](https://developer.adobe.com/graphql-mesh-gateway/mesh/basic/transforms/prefix/)
- [OpenAPI Handler Documentation](https://developer.adobe.com/graphql-mesh-gateway/mesh/handlers/openapi/)
- [Transform Documentation](https://developer.adobe.com/graphql-mesh-gateway/mesh/transforms/)

---

**Remember:** The same OpenAPI URL for multiple sources is a **documented Adobe pattern** - not a problem to fix!
