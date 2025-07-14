# Correct JSON Schema Multi-Source Approach

## Overview

This document outlines the correct approach for implementing JSON Schema sources that leverages GraphQL Mesh's automatic capabilities instead of duplicating them with custom code.

## Core Principle

**Trust the mesh to handle HTTP calls, authentication, and type generation automatically. Only write custom code for complex business logic that the mesh cannot handle.**

## Phase 1: JSON Schema Sources (Days 1-3)

### Step 1: Extract Sample Data
```bash
# Extract actual API responses for type generation
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://citisignal-com774.adobedemo.com/rest/V1/products?searchCriteria[pageSize]=5" \
  > samples/products-response.json

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://citisignal-com774.adobedemo.com/rest/V1/categories/1" \
  > samples/category-response.json

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://citisignal-com774.adobedemo.com/rest/V1/stockItems?searchCriteria[pageSize]=5" \
  > samples/inventory-response.json
```

### Step 2: Create JSON Schema Sources
```yaml
# mesh-json-schema.json
{
  "meshConfig": {
    "sources": [
      {
        "name": "Products",
        "handler": {
          "jsonSchema": {
            "endpoint": "https://citisignal-com774.adobedemo.com/rest/V1/products",
            "operationHeaders": {
              "Content-Type": "application/json",
              "x-commerce-consumer-key": "{context.headers[\"x-commerce-consumer-key\"]}",
              "x-commerce-consumer-secret": "{context.headers[\"x-commerce-consumer-secret\"]}",
              "x-commerce-access-token": "{context.headers[\"x-commerce-access-token\"]}",
              "x-commerce-access-token-secret": "{context.headers[\"x-commerce-access-token-secret\"]}"
            },
            "operations": [
              {
                "type": "Query",
                "field": "products",
                "path": "/",
                "method": "GET",
                "responseSample": "./samples/products-response.json",
                "responseTypeName": "ProductsResponse"
              }
            ]
          }
        },
        "transforms": [
          {
            "prefix": {
              "value": "Products_",
              "includeRootOperations": true
            }
          }
        ]
      },
      {
        "name": "Categories",
        "handler": {
          "jsonSchema": {
            "endpoint": "https://citisignal-com774.adobedemo.com/rest/V1/categories",
            "operationHeaders": {
              "Content-Type": "application/json",
              "x-commerce-consumer-key": "{context.headers[\"x-commerce-consumer-key\"]}",
              "x-commerce-consumer-secret": "{context.headers[\"x-commerce-consumer-secret\"]}",
              "x-commerce-access-token": "{context.headers[\"x-commerce-access-token\"]}",
              "x-commerce-access-token-secret": "{context.headers[\"x-commerce-access-token-secret\"]}"
            },
            "operations": [
              {
                "type": "Query",
                "field": "category",
                "path": "/{args.id}",
                "method": "GET",
                "responseSample": "./samples/category-response.json",
                "responseTypeName": "Category"
              }
            ]
          }
        },
        "transforms": [
          {
            "prefix": {
              "value": "Categories_",
              "includeRootOperations": true
            }
          }
        ]
      },
      {
        "name": "Inventory",
        "handler": {
          "jsonSchema": {
            "endpoint": "https://citisignal-com774.adobedemo.com/rest/V1/stockItems",
            "operationHeaders": {
              "Content-Type": "application/json",
              "Authorization": "Bearer {context.headers[\"x-commerce-admin-token\"]}"
            },
            "operations": [
              {
                "type": "Query",
                "field": "inventory",
                "path": "/",
                "method": "GET",
                "responseSample": "./samples/inventory-response.json",
                "responseTypeName": "InventoryResponse"
              }
            ]
          }
        },
        "transforms": [
          {
            "prefix": {
              "value": "Inventory_",
              "includeRootOperations": true
            }
          }
        ]
      }
    ]
  }
}
```

### Step 3: Test Automatic Generation
```bash
# Deploy the mesh with JSON Schema sources
aio api-mesh:update mesh-json-schema.json

# Test that mesh generates resolvers automatically
curl -X POST "https://graph.adobe.io/api/$MESH_ID/graphql" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { Products_products { items { sku name } } }"
  }'
```

**Expected Result**: Mesh should automatically:
- ✅ Generate `Products_products` resolver
- ✅ Handle OAuth authentication via `operationHeaders`
- ✅ Generate types from `samples/products-response.json`
- ✅ Make HTTP calls to Commerce API

## Phase 2: Mesh Transforms (Days 4-6)

### Step 1: Field Mapping
```yaml
# Add transforms to mesh configuration
transforms:
  - rename:
      renames:
        - from: { type: "Products_Product", field: "media_gallery_entries" }
          to: { type: "Products_Product", field: "images" }
  - filterSchema:
      mode: wrap
      filters:
        - "Query.Products_products"
        - "Query.Categories_category"
        - "Query.Inventory_inventory"
```

### Step 2: Type Merging
```yaml
# Use mesh's built-in type merging
additionalTypeDefs: |
  extend type Products_Product {
    categories: [Categories_Category]
    inventory: Inventory_InventoryItem
  }
```

## Phase 3: Minimal Custom Logic (Days 7-8)

### Only for Complex Business Logic
```javascript
// mesh-custom-resolvers.js - Only ~100 lines needed
module.exports = {
  Products_Product: {
    // Only custom field resolvers for complex relationships
    categories: async (product, args, context) => {
      // Extract category IDs from product
      const categoryIds = extractCategoryIds(product);
      
      // Call mesh-generated Categories resolver
      const categories = await Promise.all(
        categoryIds.map(id => 
          context.Categories.Query.category({ id })
        )
      );
      
      return categories.filter(Boolean);
    },
    
    inventory: async (product, args, context) => {
      // Call mesh-generated Inventory resolver
      const inventory = await context.Inventory.Query.inventory({
        sku: product.sku
      });
      
      return inventory || { qty: 0, is_in_stock: false };
    }
  },
  
  Query: {
    // Only for complex queries that mesh can't handle
    enrichedProducts: async (parent, args, context) => {
      // Get products from mesh-generated resolver
      const products = await context.Products.Query.products(args);
      
      // Use existing buildProducts step for transformation
      const { buildProducts } = require('./actions/get-products/steps/buildProducts');
      return buildProducts(products.items, config);
    }
  }
};

function extractCategoryIds(product) {
  // Simple utility function
  const categoryIds = [];
  if (product.custom_attributes) {
    product.custom_attributes.forEach(attr => {
      if (attr.attribute_code === 'category_ids') {
        categoryIds.push(...attr.value.split(','));
      }
    });
  }
  return categoryIds;
}
```

## What This Approach Achieves

### Code Reduction
- **HTTP Calls**: 0 lines (mesh handles automatically)
- **Authentication**: 0 lines (mesh handles via `operationHeaders`)
- **Type Definitions**: 0 lines (mesh generates from JSON samples)
- **Basic Resolvers**: 0 lines (mesh generates from `operations`)
- **Custom Code**: ~100 lines (only complex business logic)

### Mesh Utilization
- ✅ **HTTP Calls**: Mesh handles automatically
- ✅ **Authentication**: Mesh handles via `operationHeaders`
- ✅ **Type Generation**: Mesh generates from JSON samples
- ✅ **Basic Resolvers**: Mesh generates from `operations`
- ✅ **Transforms**: Mesh handles field mapping and filtering
- ✅ **Error Handling**: Mesh provides standard error handling

### Functionality Preservation
- ✅ **119 Products**: Same data fetching capability
- ✅ **OAuth Authentication**: Handled automatically by mesh
- ✅ **CSV Generation**: Use existing `buildProducts` step
- ✅ **Performance**: Mesh provides caching and optimization

## Testing the Correct Approach

### Validation Queries
```graphql
# Test mesh-generated resolvers
query TestProducts {
  Products_products {
    items {
      sku
      name
      price
    }
  }
}

query TestCategories {
  Categories_category(id: 1) {
    name
    parent_id
  }
}

query TestInventory {
  Inventory_inventory {
    items {
      sku
      qty
      is_in_stock
    }
  }
}

# Test custom enriched query
query TestEnriched {
  enrichedProducts {
    sku
    name
    categories {
      name
    }
    inventory {
      qty
    }
  }
}
```

## Success Metrics

### Configuration
- **Mesh Configuration**: <100 lines
- **Custom Resolvers**: <100 lines
- **Type Definitions**: 0 lines (mesh-generated)
- **HTTP Utilities**: 0 lines (mesh-handled)

### Functionality
- **Products Fetched**: 119 (same as current)
- **Authentication**: OAuth 1.0 (handled by mesh)
- **CSV Output**: Identical to current
- **Performance**: Equal or better (mesh optimizations)

## Key Differences from Our Current Implementation

| Aspect | Current Implementation | Correct Implementation |
|--------|----------------------|----------------------|
| **HTTP Calls** | 903 lines of custom code | 0 lines (mesh handles) |
| **Authentication** | 119 lines of OAuth code | 0 lines (operationHeaders) |
| **Types** | 156 lines of custom types | 0 lines (mesh generates) |
| **Resolvers** | 903 lines of custom resolvers | ~100 lines (only complex logic) |
| **Maintenance** | High (all custom) | Low (mesh handles most) |
| **Debugging** | Custom error handling | Standard mesh debugging |
| **Testing** | Mock HTTP calls | Test only business logic |

## Conclusion

The correct JSON Schema approach leverages GraphQL Mesh's automatic capabilities:

1. **Mesh handles**: HTTP calls, authentication, type generation, basic resolvers
2. **We handle**: Only complex business logic that mesh cannot handle
3. **Result**: Same functionality with 90% less code and better maintainability 