# JsonSchema Sources Architecture Pattern

**The JsonSchema Sources Pattern is our current implementation** for integrating API Mesh with Adobe App Builder using native mesh sources that consolidate multiple Commerce API calls into a single GraphQL query.

## Overview

**JsonSchema Sources Pattern**: Native mesh sources that use JsonSchema handlers to consolidate data from multiple Commerce APIs (products, categories, inventory) with admin token authentication.

## Architecture Diagram

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Request  │ -> │   API Mesh      │ -> │ JsonSchema      │ -> │  Commerce APIs  │
│                 │    │                 │    │ Sources         │    │  (Products,     │
│                 │    │                 │    │                 │    │   Categories,   │
│                 │    │                 │    │                 │    │   Inventory)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Benefits

| Metric | REST API | JsonSchema Sources | Improvement |
|--------|----------|-------------------|-------------|
| **API Calls** | 200+ sequential | 1 GraphQL query | 99.5% reduction |
| **Authentication** | OAuth 1.0 | Admin token | Simplified |
| **Configuration** | Custom resolvers | JsonSchema sources | Declarative |
| **Maintenance** | Complex resolver code | Schema files | Easier |

## Implementation

### Current Implementation (JsonSchema Sources)

```javascript
// mesh.config.js - Configuration-driven approach
const { loadConfig } = require('./config');

const config = loadConfig();

module.exports = {
  sources: [
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
              path: `/products?searchCriteria[pageSize]=${config.products.pagination.pageSize}`,
              method: 'GET',
              responseSchema: './src/mesh/schema/products-response.json',
            },
          ],
        },
      },
    },
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
          ],
        },
      },
    },
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
              path: '/inventory/source-items?searchCriteria[pageSize]=200',
              method: 'GET',
              responseSchema: './src/mesh/schema/inventory-response.json',
            },
          ],
        },
      },
    },
  ],
};
```

## Admin Token Authentication

### Authentication Flow

The JsonSchema sources use admin tokens for simplified authentication:

```javascript
// Headers passed to mesh
const headers = {
  'x-commerce-admin-token': adminToken,
};

// Mesh configuration uses bearer token
Authorization: 'Bearer {context.headers.x-commerce-admin-token}'
```

### Benefits

- **Simplified setup**: No OAuth key management
- **Direct authentication**: Bearer token in Authorization header
- **Consistent**: Same token works across all Commerce APIs
- **Secure**: Admin tokens can be scoped and rotated

## JSON Schema Configuration

### Response Schema Structure

Each source uses JSON Schema files to define expected response structure:

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "sku": { "type": "string" },
          "name": { "type": "string" },
          "price": { "type": "number" },
          "status": { "type": "integer" },
          "visibility": { "type": "integer" },
          "type_id": { "type": "string" },
          "category_ids": {
            "type": "array",
            "items": { "type": "string" }
          },
          "media_gallery_entries": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "integer" },
                "media_type": { "type": "string" },
                "label": { "type": "string" },
                "file": { "type": "string" }
              }
            }
          }
        }
      }
    },
    "search_criteria": { "type": "object" },
    "total_count": { "type": "integer" }
  }
}
```

### Schema File Organization

```text
src/mesh/schema/
├── products-response.json      # Products API response schema
├── categories-response.json    # Categories API response schema
└── inventory-response.json     # Inventory API response schema
```

## GraphQL Query Interface

### Products Query

```graphql
query {
  products_list {
    items {
      id
      sku
      name
      price
      status
      visibility
      type_id
      category_ids
      media_gallery_entries {
        id
        media_type
        label
        file
      }
    }
    total_count
  }
}
```

### Categories Query

```graphql
query {
  category_info(categoryId: 2) {
    id
    name
    is_active
    parent_id
    path
    available_sort_by
    include_in_menu
  }
}
```

### Inventory Query

```graphql
query {
  inventory_items {
    items {
      sku
      source_code
      quantity
      status
    }
    total_count
  }
}
```

## Action Integration

### Mesh Data Consumption

Actions consume mesh data through GraphQL queries:

```javascript
// actions/backend/get-products-mesh/index.js
const { fetchProductsFromMesh } = require('./steps/fetchProductsFromMesh');
const { buildProducts } = require('../get-products/steps/buildProducts');

async function main(params) {
  const config = loadConfig(params);
  
  // Fetch from mesh using GraphQL
  const meshData = await fetchProductsFromMesh(config, params);
  
  // Use shared transformation logic
  const builtProducts = await buildProducts(meshData.products, config);
  
  // Generate CSV
  const csvData = await createCsv(builtProducts, config);
  
  // Store file
  const storageResult = await storeCsv(csvData, params);
  
  return response.success({
    message: 'Products exported successfully via API Mesh',
    storage: storageResult.storage,
    downloadUrl: storageResult.downloadUrl,
  });
}
```

### Data Transformation Separation

**Critical**: Data transformation happens in actions, not in mesh sources:

```javascript
// ✅ CORRECT: Mesh returns raw data
const meshData = await fetchProductsFromMesh(config, params);

// ✅ CORRECT: Actions handle transformation
const builtProducts = await buildProducts(meshData.products, config);

// ❌ WRONG: Don't transform data in mesh sources
// Mesh sources should only consolidate raw API responses
```

## Configuration Integration

### Environment Configuration

Mesh configuration integrates with the project's configuration system:

```javascript
// Dynamic configuration loading
const config = loadConfig();

// Environment-specific Commerce URL
baseUrl: `${config.commerce.baseUrl}/rest/all/V1`,

// Configuration-driven pagination
path: `/products?searchCriteria[pageSize]=${config.products.pagination.pageSize}`,
```

### Configuration Files

```text
config/
├── environments/
│   ├── staging.js              # Staging configuration
│   └── production.js           # Production configuration
├── domains/
│   ├── commerce.js             # Commerce-specific settings
│   └── products.js             # Product-specific settings
└── index.js                    # Main configuration loader
```

## Deployment Process

### Build Process

```bash
# Build mesh configuration
npm run build

# Deploy with mesh updates
npm run deploy

# Production deployment
npm run deploy:prod
```

### Mesh Update Flow

```text
npm run deploy
├── Environment Detection
├── Build Process (generates mesh.json from mesh.config.js)
├── Deploy App Builder Actions
└── Update API Mesh (if configuration changed)
    ├── Upload mesh.json configuration
    ├── Wait for provisioning (90 seconds)
    ├── Verify mesh status
    └── Retry if needed (up to 3 attempts)
```

## Performance Characteristics

### Query Consolidation

- **Products**: Single API call retrieves all products with pagination
- **Categories**: On-demand category lookups by ID
- **Inventory**: Bulk inventory data retrieval
- **Parallel**: Native mesh optimization for concurrent requests

### Comparison Metrics

| Aspect | REST API | JsonSchema Sources |
|--------|----------|-------------------|
| **Initial Load** | 200+ sequential calls | 1 GraphQL query |
| **Authentication** | OAuth 1.0 signatures | Admin bearer token |
| **Configuration** | Code-based | Schema-based |
| **Maintenance** | Complex logic | Declarative config |
| **Performance** | 6-8 seconds | 1-2 seconds |

## Error Handling

### Authentication Errors

```javascript
// Handle invalid admin token
if (error.message.includes('Unauthorized')) {
  throw new Error('Invalid admin token provided');
}
```

### Schema Validation Errors

```javascript
// Handle schema validation failures
if (error.message.includes('schema')) {
  throw new Error('Response schema validation failed');
}
```

### Network Errors

```javascript
// Handle mesh endpoint failures
if (error.message.includes('ECONNREFUSED')) {
  throw new Error('Unable to connect to mesh endpoint');
}
```

## Testing and Validation

### Test Commands

```bash
# Test mesh endpoint
npm run test:action get-products-mesh

# Performance comparison
npm run test:perf:compare

# Schema validation
npm run test:schemas
```

### Validation Results

```text
✅ Products: 119/119 products retrieved (100% coverage)
✅ Categories: Default Category (ID: 2) retrieved
✅ Inventory: 120 inventory items retrieved
✅ Authentication: Admin token validated
✅ Schema: All response schemas validated
```

## Troubleshooting

### Common Issues

1. **Invalid admin token**: Verify token permissions in Commerce admin
2. **Schema validation failures**: Check JSON Schema files match API responses
3. **Configuration errors**: Validate mesh.config.js syntax
4. **Deployment failures**: Check mesh endpoint and credentials

### Debug Commands

```bash
# Check mesh status
npm run deploy:mesh:status

# Validate configuration
npm run validate

# Test individual sources
npm run test:action get-products-mesh
```

## Migration from Custom Resolvers

### Previous Implementation (Deprecated)

The old custom resolver approach used embedded JavaScript code:

```javascript
// Old approach (deprecated)
module.exports = {
  resolvers: {
    Query: {
      mesh_products_enriched: {
        resolve: async (parent, args, context) => {
          // Complex embedded logic
          // 200+ lines of code
        },
      },
    },
  },
};
```

### Current Implementation (JsonSchema Sources)

The new approach uses declarative configuration:

```javascript
// New approach (current)
module.exports = {
  sources: [
    {
      name: 'Products',
      handler: {
        JsonSchema: {
          // Simple declarative configuration
          // No embedded logic
        },
      },
    },
  ],
};
```

### Migration Benefits

- **Simplified configuration**: Declarative vs procedural
- **Better maintainability**: Schema files vs embedded code
- **Easier debugging**: Standard HTTP patterns
- **Improved performance**: Native mesh optimization

## Future Enhancements

### Planned Improvements

- **Enhanced caching**: GraphQL-level response caching
- **Field selection**: Query only needed fields
- **Batch operations**: Multiple entity queries in single request
- **Real-time updates**: Subscription support for live data

### Scaling Considerations

- **Pagination**: Configurable page sizes for different environments
- **Rate limiting**: Implement mesh-specific rate limiting
- **Monitoring**: GraphQL query performance metrics
- **Caching**: Response caching for frequently accessed data

---

## Summary

The JsonSchema Sources pattern provides a clean, maintainable, and performant solution for consolidating Commerce API calls. By leveraging native mesh capabilities with admin token authentication, we achieve significant performance improvements while maintaining code simplicity and architectural consistency.

The declarative configuration approach eliminates the need for custom resolver code, making the system easier to maintain and debug while providing better performance through native mesh optimization.
