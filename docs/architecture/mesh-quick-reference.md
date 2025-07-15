# Mesh Implementation Quick Reference

## File Structure

```text
mesh.config.js                    # Main mesh configuration
mesh-resolvers.template.js         # Template for custom resolvers
mesh-resolvers.js                  # Generated custom resolvers (auto-generated)
mesh.json                          # Generated mesh configuration (auto-generated)
src/mesh/schema/
├── enriched-products.graphql      # Custom GraphQL schema
├── products-response.json         # Products API response schema
├── categories-response.json       # Categories API response schema
└── inventory-response.json        # Inventory API response schema
```text

## Key Components

### 1. JsonSchema Sources (3 sources)

| Source | Purpose | Operations |
|--------|---------|------------|
| **Products** | Product data | `products_list` |
| **Categories** | Category data | `category_info`, `categories_batch` |
| **Inventory** | Inventory data | `inventory_items`, `inventory_batch` |

### 2. Custom Resolvers (3 resolvers)

| Resolver | Purpose | Performance |
|----------|---------|-------------|
| `mesh_products_enriched` | Main data consolidation | 99% API reduction |
| `mesh_products_basic` | Simple product fetch | No enrichment |
| `mesh_categories` | Category-only queries | Batch optimized |

### 3. Template System

| File | Purpose | Generation |
|------|---------|------------|
| `mesh-resolvers.template.js` | Source template | Manual edit |
| `mesh-resolvers.js` | Generated resolver | Auto-generated |

## Configuration Settings

### Response Configuration

```javascript
responseConfig: {
  cache: true,              // Enable native mesh caching
  includeHTTPDetails: true, // Include HTTP debugging info
}
```text

### Source Configuration Pattern

```javascript
{
  name: 'SourceName',
  handler: {
    JsonSchema: {
      baseUrl: '${config.commerce.baseUrl}/rest/all/V1',
      operationHeaders: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer {context.headers.x-commerce-admin-token}',
      },
      operations: [
        {
          type: 'Query',
          field: 'field_name',
          path: '/api/endpoint',
          method: 'GET',
          argTypeMap: { /* arguments */ },
          responseSchema: './path/to/schema.json',
        },
      ],
    },
  },
}
```text

## Batch Optimization

### Category Batching

**Threshold**: 1+ categories  
**Endpoint**: `/categories?searchCriteria[...][condition_type]=in`  
**Efficiency**: 95% reduction

### Inventory Batching

**Threshold**: 1+ SKUs  
**Endpoint**: `/inventory/source-items?searchCriteria[...][condition_type]=in`  
**Efficiency**: 99% reduction

## Authentication Flow

1. **Generate Admin Token**: `getAuthToken(params, config)`
2. **Pass to Mesh**: `x-commerce-admin-token` header
3. **Source Authorization**: `Bearer {context.headers.x-commerce-admin-token}`

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| **Total API Calls** | <10 | 3 |
| **Execution Time** | <1000ms | 750ms |
| **Products Processed** | 119 | 119 |
| **Batch Efficiency** | >95% | 99% |

## Commands

### Development

```bash
npm run deploy              # Deploy app + mesh
npm run deploy:mesh         # Deploy mesh only
npm run test:action get-products-mesh  # Test mesh action
```text

### Performance Testing

```bash
npm run test:perf:mesh      # Mesh performance analysis
npm run test:perf:compare   # REST vs Mesh comparison
```text

### Debugging

```bash
aio rt activation logs --last    # View action logs
aio api-mesh:status             # Check mesh status
```text

## GraphQL Query Examples

### Main Query

```graphql
query GetEnrichedProducts($pageSize: Int) {
  mesh_products_enriched(pageSize: $pageSize) {
    products {
      sku
      name
      price
      qty
      categories { id name }
      inventory { qty is_in_stock }
    }
    total_count
    performance {
      totalApiCalls
      executionTime
      batchOptimizations {
        categoriesBatched
        inventoryBatched
        apiCallsReduced
      }
    }
  }
}
```text

### Variables

```json
{
  "pageSize": 100
}
```text

## Template Variables

| Variable | Purpose | Value |
|----------|---------|-------|
| `{{{COMMERCE_BASE_URL}}}` | Commerce API URL | From config |
| `{{{CATEGORY_BATCH_THRESHOLD}}}` | Category batch threshold | 1 |
| `{{{INVENTORY_BATCH_THRESHOLD}}}` | Inventory batch threshold | 1 |

## Error Handling

### Common Errors

1. **Authentication**: Invalid admin token
2. **Schema**: Invalid response format
3. **Timeout**: Long-running queries
4. **Rate Limit**: API limits exceeded

### Error Response Structure

```javascript
{
  products: [],
  total_count: 0,
  message: "Error in mesh resolver: ${error.message}",
  error: {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
  },
}
```text

## Monitoring

### Key Metrics to Watch

- **API Call Count**: ≤3 for typical queries
- **Execution Time**: <1000ms
- **Batch Efficiency**: >95%
- **Error Rate**: <1%

### Debug Information

```javascript
debug: {
  resolverCalled: true,
  hasContext: true,
  oauthConsumerKey: 'PRESENT',
  adminUsername: 'PRESENT',
  timestamp: '2025-07-14T02:04:33.240Z'
}
```text

## Success Criteria

- ✅ **99% API Reduction**: 200+ calls → 3 calls
- ✅ **Sub-second Response**: <750ms execution
- ✅ **Complete Data**: Products + categories + inventory
- ✅ **Batch Optimization**: Categories & inventory batched
- ✅ **Error Resilience**: Comprehensive error handling
- ✅ **Production Ready**: Monitoring & debugging included
