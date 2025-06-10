# API Mesh Integration

## Overview

This document describes the implementation of Adobe App Builder API Mesh integration to consolidate Commerce API calls and improve performance compared to traditional REST API approaches.

## Problem Statement

The original `get-products` action makes multiple sequential API calls:

1. **Products API**: `/rest/V1/products` (with pagination)
2. **Inventory API**: `/rest/V1/stockItems/{sku}` (per product SKU)
3. **Categories API**: `/rest/V1/categories/{categoryId}` (per category)

For 100 products with categories, this results in **200+ API calls**, leading to:

- High latency due to sequential requests
- Rate limiting concerns
- Complex error handling
- Poor performance at scale

## API Mesh Solution

API Mesh consolidates these multiple calls into a **single GraphQL query** using custom resolvers that:

- Fetch all products in one request
- Batch inventory queries in parallel
- Batch category queries in parallel
- Return consolidated data structure
- Include both enabled and disabled products

### Performance Comparison

| Method | API Calls | Latency | Complexity |
|--------|-----------|---------|------------|
| REST API | 200+ calls | High | Complex |
| API Mesh | 1 call | Low | Simple |

## Implementation

### 1. Mesh Configuration (`mesh.json`)

```json
{
  "meshConfig": {
    "sources": [
      {
        "name": "REST",
        "handler": {
          "openapi": {
            "source": "https://com774.adobedemo.com/rest/all/schema?services=all"
          }
        }
      },
      {
        "name": "GraphQL",
        "handler": {
          "graphql": {
            "endpoint": "https://com774.adobedemo.com/graphql"
          }
        }
      }
    ],
    "additionalResolvers": [
      "./mesh-resolvers.js"
    ]
  }
}
```

### 2. Custom Resolvers (`mesh-resolvers.js`)

The custom resolvers provide:

#### `enhancedProducts` Query

- **Input**: `pageSize`, `currentPage`
- **Output**: Products with inventory and category data
- **Features**: Includes all products (enabled/disabled)

#### `enhancedProductBySku` Query  

- **Input**: `sku`
- **Output**: Single product with full details
- **Features**: Complete product information

### 3. Backend Action (`actions/backend/get-products-mesh/index.js`)

The new action:

- Uses single GraphQL query to API Mesh
- Follows project configuration patterns
- Maintains same response structure as original action
- Includes performance metrics

Key features:

- **Configuration**: Uses `loadConfig(actionParams)`
- **Tracing**: Uses `createTraceContext()` and `finalizeLogs()`
- **Storage**: Uses `initializeStorage()` for file operations
- **Error Handling**: Consistent error responses
- **URL Management**: Uses `buildRuntimeUrl()` for download URLs

### 4. Frontend Integration

#### Updated UI (`web-src/index.html`)

Added export section with two options:

- **Export via REST API**: Traditional multiple calls
- **Export via API Mesh**: Consolidated single query

#### HTMX Integration

```html
<button 
  hx-post="./api/v1/web/kukla-integration-service/get-products-mesh"
  hx-target="#export-status"
  data-export-method="api-mesh">
  Export via API Mesh
</button>
```

#### JavaScript Handler (`web-src/src/js/components/export-handler.js`)

Provides:

- Success/error notifications
- Performance comparison display
- Auto-refresh of file list
- Download button generation

## Configuration

### Environment Configuration

Added to both `staging.js` and `production.js`:

```javascript
mesh: {
  endpoint: 'https://graph.adobe.io/api/{meshId}/graphql',
  apiKey: process.env.MESH_API_KEY,
  timeout: 30000,
  retries: 3,
}
```

### Action Configuration (`app.config.yaml`)

```yaml
get-products-mesh:
  function: actions/backend/get-products-mesh/index.js
  web: 'yes'
  runtime: nodejs:18
  inputs:
    MESH_API_KEY: $MESH_API_KEY
    # ... other inputs
```

### Environment Variables

Add to `.env`:

```bash
MESH_API_KEY=your_mesh_api_key_here
```

## GraphQL Query Structure

### Enhanced Products Query

```graphql
query GetEnhancedProducts($pageSize: Int, $currentPage: Int) {
  enhancedProducts(pageSize: $pageSize, currentPage: $currentPage) {
    items {
      id
      sku
      name
      status
      isEnabled
      statusLabel
      isInStock
      stockQuantity
      inventory {
        qty
        is_in_stock
        # ... other inventory fields
      }
      categories {
        id
        name
        # ... other category fields
      }
    }
    totalCount
    pageInfo {
      currentPage
      pageSize
      totalPages
    }
  }
}
```

## Product Visibility Solution

### The Challenge

Standard GraphQL Commerce queries typically return only **visible products**, which excludes disabled products that may be needed for export operations.

### The Solution

Our custom resolvers use the **REST API** source within the mesh to:

1. Query `/rest/V1/products` without status filtering
2. Include `filterGroups: []` to get ALL products
3. Add computed fields like `isEnabled`, `statusLabel`
4. Provide both enabled and disabled products in results

### Key Differences

| Approach | Visible Products | Disabled Products | API Source |
|----------|------------------|-------------------|------------|
| Standard GraphQL | ✅ Yes | ❌ No | GraphQL endpoint |
| Custom Resolvers | ✅ Yes | ✅ Yes | REST API via mesh |

## Testing

### Test the New Action

```bash
# Test the API Mesh action
node scripts/test-action.js get-products-mesh
```

### Compare Performance

1. Test original action: `node scripts/test-action.js get-products`
2. Test mesh action: `node scripts/test-action.js get-products-mesh`
3. Compare API call counts and response times

### Frontend Testing

1. Start development server: `npm start`
2. Open the application in browser
3. Try both export methods
4. Compare performance and results

## Deployment

### Staging Deployment

```bash
npm run deploy
```

### Production Deployment

```bash
npm run deploy:prod
```

## Benefits

### Performance Benefits

- **Reduced API Calls**: 200+ calls → 1 call
- **Lower Latency**: Parallel execution within mesh
- **Better Caching**: Single query result caching
- **Reduced Rate Limiting**: Fewer requests

### Development Benefits

- **Simplified Logic**: Single query vs complex orchestration
- **Better Error Handling**: Single failure point
- **Easier Testing**: Test one query instead of many
- **Consistent Data**: All data from single transaction

### Operational Benefits

- **Reduced Server Load**: Fewer Commerce API requests
- **Better Scalability**: Constant API usage regardless of product count
- **Improved Reliability**: Less complex request chain
- **Enhanced Monitoring**: Single query to track

## Limitations

### API Mesh Limitations

- Requires API Mesh setup and configuration
- Additional dependency on Adobe services
- Learning curve for GraphQL/resolver patterns
- Mesh endpoint availability dependency

### Implementation Notes

- Mesh endpoint URL requires actual `{meshId}` replacement
- API key authentication required
- Custom resolvers must be deployed with mesh
- Error handling differs from direct REST calls

## Future Enhancements

### Possible Improvements

1. **Caching**: Add Redis/memory caching for mesh responses
2. **Pagination**: Implement cursor-based pagination
3. **Filtering**: Add product filtering by category, status, etc.
4. **Real-time**: Use subscriptions for real-time updates
5. **Batching**: Implement DataLoader pattern for optimal batching

### Additional Resolvers

1. **Category Tree**: Full category hierarchy resolver
2. **Product Relations**: Related/cross-sell product resolver
3. **Price Tiers**: Customer group pricing resolver
4. **Inventory Locations**: Multi-source inventory resolver

## Troubleshooting

### Common Issues

#### Mesh Endpoint Not Found

- Verify `MESH_API_KEY` is set correctly
- Check mesh endpoint URL format
- Ensure mesh is deployed and active

#### GraphQL Errors

- Check resolver syntax in `mesh-resolvers.js`
- Verify Commerce API endpoint availability
- Review mesh logs for detailed errors

#### Authentication Failures

- Confirm API key has proper permissions
- Check Commerce admin credentials
- Verify mesh authentication configuration

#### Performance Issues

- Monitor batch sizes in resolvers
- Check Commerce API rate limits
- Review mesh caching configuration

### Debug Tools

1. **Action Logs**: Check Adobe I/O Runtime logs
2. **Browser DevTools**: Monitor GraphQL requests
3. **Mesh Logs**: Check API Mesh execution logs
4. **Commerce Logs**: Review Commerce API access logs

## Conclusion

The API Mesh integration provides significant performance improvements while maintaining compatibility with existing functionality. The implementation follows established project patterns and provides a solid foundation for future GraphQL-based enhancements.

The solution successfully addresses the product visibility challenge by using REST API sources within the mesh, ensuring both enabled and disabled products are included in export operations.
