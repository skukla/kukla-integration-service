# API Mesh Integration with JsonSchema Sources

## Overview

This document describes the implementation of Adobe App Builder API Mesh integration using **JsonSchema sources** to consolidate Commerce API calls using admin token authentication and declarative schema configuration.

## Architecture

The JsonSchema approach consolidates data using native mesh sources:

```text
User Request → API Mesh → JsonSchema Sources → Commerce APIs (parallel) → Consolidated Data
```

### Performance Benefits

- **200+ API calls** consolidated into **1 GraphQL query**
- **Parallel data fetching** using native mesh capabilities
- **Admin token authentication** for simplified security
- **Configuration-driven** schema generation

## JsonSchema Sources Solution (Current Implementation)

The JsonSchema pattern provides optimal performance and architectural benefits:

### Architecture Flow

```text
User Request → API Mesh → JsonSchema Sources → Commerce APIs → Consolidated Data
```

## Problem Statement

The original `get-products` action makes multiple sequential API calls:

1. **Products API**: `/rest/V1/products` (with pagination)
2. **Inventory API**: `/rest/V1/stockItems/{sku}` (per product SKU)  
3. **Categories API**: `/rest/V1/categories/{categoryId}` (per category)

For 119 products with categories and inventory, this results in **200+ API calls**, leading to:

- High latency due to sequential requests
- Rate limiting concerns  
- Complex error handling
- Poor performance at scale

## JsonSchema Sources Pattern (Current Implementation)

The JsonSchema sources pattern solves both performance and architectural challenges:

### Key Features

- **Native mesh sources**: Uses built-in JsonSchema handlers
- **Admin token authentication**: Simplified bearer token authentication
- **Declarative configuration**: Schema-driven approach
- **Multi-source consolidation**: Products, categories, and inventory sources

### Configuration Structure

```javascript
// mesh.config.js
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

## Authentication Method

### Admin Token Authentication

The current implementation uses Commerce admin tokens for authentication:

```javascript
// Headers passed to mesh
const headers = {
  'x-commerce-admin-token': adminToken,
};
```

### Benefits of Admin Token Authentication

- **Simplified setup**: No OAuth key management
- **Direct authentication**: Bearer token in Authorization header
- **Consistent**: Same token works across all Commerce APIs
- **Secure**: Admin tokens can be scoped and rotated

## JSON Schema Configuration

### Response Schema Files

The mesh uses JSON Schema files to define the expected response structure:

```javascript
// src/mesh/schema/products-response.json
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

### Configuration Integration

The mesh configuration is integrated with the project's configuration system:

```javascript
// Configuration-driven values
const config = loadConfig();

// Dynamic pagination
path: `/products?searchCriteria[pageSize]=${config.products.pagination.pageSize}`,

// Environment-specific baseUrl
baseUrl: `${config.commerce.baseUrl}/rest/all/V1`,
```

## Deployment Process

### Build and Deploy

```bash
# Build mesh configuration
npm run build

# Deploy with mesh updates
npm run deploy

# Production deployment
npm run deploy:prod
```

### Mesh Status Verification

```bash
# Check mesh status
npm run deploy:mesh:status

# Update mesh only
npm run deploy:mesh
```

## Query Examples

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
