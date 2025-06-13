# Adobe Commerce Integration Architecture

> **Commerce API integration patterns and data flow for Adobe App Builder**

## Overview

The Kukla Integration Service provides comprehensive Adobe Commerce integration through both traditional REST API and modern API Mesh (GraphQL) approaches. This document outlines the architecture, patterns, and best practices for Commerce integration.

## Integration Architecture

### **Dual Integration Approach**

```text
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│  REST API Method          │  API Mesh Method              │
│  ├── 200+ API Calls       │  └── 1 GraphQL Query          │
│  ├── Sequential Execution │     (HTTP Bridge Pattern)     │
│  └── Direct Commerce API  │                               │
├─────────────────────────────────────────────────────────────┤
│                    Shared Utilities                        │
│  ├── Authentication       │  ├── Data Transformation      │
│  ├── Rate Limiting        │  └── Error Handling           │
├─────────────────────────────────────────────────────────────┤
│                   Adobe Commerce API                       │
│  ├── Products API         │  ├── Categories API           │
│  ├── Inventory API        │  └── Authentication API       │
└─────────────────────────────────────────────────────────────┘
```

## Commerce API Integration

### **Authentication**

```javascript
// src/commerce/auth.js
const getCommerceAuthToken = async (config, credentials) => {
  const { baseUrl } = config.commerce;
  const { username, password } = credentials;

  const response = await fetch(`${baseUrl}/rest/V1/integration/admin/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  return response.json(); // Returns bearer token
};
```

### **Product Data Fetching**

```javascript
// src/commerce/products.js
const fetchProducts = async (config, authToken, params = {}) => {
  const { baseUrl, api: { timeout } } = config.commerce;
  const { pageSize = 100, currentPage = 1 } = params;

  const searchCriteria = {
    searchCriteria: {
      pageSize,
      currentPage,
      filterGroups: [] // Includes all products (enabled/disabled)
    }
  };

  const response = await fetch(`${baseUrl}/rest/V1/products`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    timeout
  });

  return response.json();
};
```

### **Inventory Enrichment**

```javascript
// src/commerce/inventory.js
const enrichWithInventory = async (products, config, authToken) => {
  const inventoryPromises = products.map(async (product) => {
    const response = await fetch(
      `${config.commerce.baseUrl}/rest/V1/stockItems/${product.sku}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    const inventory = await response.json();
    return { ...product, inventory };
  });

  return Promise.all(inventoryPromises);
};
```

### **Category Enrichment**

```javascript
// src/commerce/categories.js
const enrichWithCategories = async (products, config, authToken) => {
  // Batch fetch categories to avoid N+1 queries
  const categoryIds = [...new Set(
    products.flatMap(p => p.category_links?.map(c => c.category_id) || [])
  )];

  const categories = await fetchCategoriesBatch(categoryIds, config, authToken);
  
  return products.map(product => ({
    ...product,
    categories: product.category_links?.map(link => 
      categories.find(cat => cat.id === link.category_id)
    ).filter(Boolean) || []
  }));
};
```

## API Mesh Integration

### **HTTP Bridge Pattern**

The API Mesh integration uses the HTTP Bridge pattern to eliminate code duplication:

```javascript
// mesh-resolvers.js
module.exports = {
  resolvers: {
    Query: {
      mesh_products_full: {
        resolve: async (parent, args, context) => {
          // Get credentials from headers
          const username = context.headers['x-commerce-username'];
          const password = context.headers['x-commerce-password'];
          
          // Call existing REST action via HTTP Bridge
          const restResponse = await fetch(REST_ACTION_URL + '?format=json', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-commerce-username': username,
              'x-commerce-password': password,
            },
          });

          const data = await restResponse.json();
          
          return {
            products: data.products || [],
            total_count: data.total_count || 0,
            message: data.message || 'Success via HTTP bridge',
            status: 'success'
          };
        }
      }
    }
  }
};
```

**Benefits:**

- **78% Code Reduction**: 60 lines vs 273 lines of embedded logic
- **Perfect Parity**: Identical CSV output from both methods
- **Zero Duplication**: Single source of truth in REST action
- **<1% Overhead**: Minimal performance impact for significant maintenance benefits

## Data Flow Patterns

### **REST API Flow**

```text
1. User Request → get-products action
2. Validate Input → Extract parameters
3. Authenticate → Get Commerce admin token  
4. Fetch Products → /rest/V1/products (paginated)
5. Enrich Inventory → /rest/V1/stockItems/{sku} (parallel)
6. Enrich Categories → /rest/V1/categories/{id} (batched)
7. Transform Data → Build CSV structure
8. Store File → Adobe I/O Files or S3
9. Return Response → Download URL and metadata
```

**API Calls**: 200+ (1 auth + 1 products + 119 inventory + ~20 categories)

### **API Mesh Flow**

```text
1. User Request → get-products-mesh action
2. Validate Input → Extract parameters
3. GraphQL Query → mesh_products_full resolver
4. HTTP Bridge → Call get-products?format=json
5. REST Processing → Complete data fetching and enrichment
6. Transform Data → Skip (already done by REST action)
7. Store File → Reuse existing storage logic
8. Return Response → Download URL and metadata
```

**API Calls**: 1 GraphQL + 200+ internal (consolidated)

## Performance Optimization

### **Caching Strategy**

```javascript
// Commerce data caching patterns
const cache = {
  auth: { ttl: 3600 }, // 1 hour
  products: { ttl: 300 }, // 5 minutes
  categories: { ttl: 1800 }, // 30 minutes
  inventory: { ttl: 60 } // 1 minute (frequently changing)
};
```

### **Rate Limiting**

```javascript
// Commerce API rate limiting
const rateLimiter = {
  requests: 100,
  window: 60000, // 1 minute
  backoff: 'exponential'
};
```

### **Batch Processing**

- **Categories**: Fetch in batches to reduce API calls
- **Inventory**: Parallel requests with concurrency limits
- **Products**: Pagination with optimized page sizes

## Error Handling

### **Commerce API Errors**

```javascript
const handleCommerceError = (error, context) => {
  if (error.status === 401) {
    // Re-authenticate and retry
    return retryWithNewAuth(context);
  }
  
  if (error.status === 429) {
    // Rate limited - exponential backoff
    return retryWithBackoff(context);
  }
  
  if (error.status >= 500) {
    // Server error - retry with jitter
    return retryWithJitter(context);
  }
  
  // Client error - don't retry
  throw new CommerceAPIError(error);
};
```

### **Data Validation**

```javascript
const validateProductData = (product) => {
  const required = ['sku', 'name', 'status'];
  const missing = required.filter(field => !product[field]);
  
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return product;
};
```

## Configuration

### **Commerce Configuration**

Commerce integration uses environment-specific configuration:

```javascript
// config/environments/staging.js
module.exports = {
  commerce: {
    baseUrl: 'https://citisignal-com774.adobedemo.com',
    api: {
      timeout: 30000,
      retries: 3,
      rateLimit: {
        requests: 100,
        window: 60000
      }
    },
    product: {
      pagination: {
        pageSize: 100,
        maxPages: 50
      },
      fields: [
        'sku', 'name', 'status', 'price', 'category_links',
        'custom_attributes', 'media_gallery_entries'
      ]
    }
  }
};
```

### **Credential Management**

```bash
# .env file (credentials only)
COMMERCE_ADMIN_USERNAME=admin
COMMERCE_ADMIN_PASSWORD=your_password

# app.config.yaml (pass to actions)
inputs:
  COMMERCE_ADMIN_USERNAME: $COMMERCE_ADMIN_USERNAME
  COMMERCE_ADMIN_PASSWORD: $COMMERCE_ADMIN_PASSWORD
```

## Security Considerations

### **Authentication Security**

- **Token Management**: Automatic token refresh and secure storage
- **Credential Separation**: Credentials in `.env`, URLs in environment config
- **Scope Limitation**: Use minimal required permissions

### **Data Security**

- **Input Validation**: Comprehensive validation of all inputs
- **Output Sanitization**: Clean data before transformation
- **Rate Limiting**: Prevent abuse and protect Commerce instance

### **Network Security**

- **HTTPS Only**: All Commerce API calls use HTTPS
- **Header Validation**: Verify response headers and content types
- **Timeout Management**: Prevent hanging requests

## Best Practices

### **Development Patterns**

1. **Use Configuration System**: Never hardcode Commerce URLs
2. **Leverage Utilities**: Reuse authentication and data fetching functions
3. **Handle Errors Gracefully**: Implement retry logic and fallbacks
4. **Cache Strategically**: Cache stable data, refresh volatile data
5. **Monitor Performance**: Track API call counts and response times

### **API Usage**

1. **Batch Operations**: Group related API calls when possible
2. **Parallel Processing**: Use concurrent requests for independent data
3. **Respect Rate Limits**: Implement exponential backoff
4. **Validate Responses**: Check data integrity before processing

### **Integration Patterns**

1. **HTTP Bridge for Mesh**: Use for complex logic with existing REST actions
2. **Step Functions**: Reuse data fetching and transformation logic
3. **Environment Awareness**: Different configurations for staging/production
4. **Error Boundaries**: Isolate failures to prevent cascading issues

## Testing

### **Commerce API Testing**

```bash
# Test Commerce connectivity
npm run test:action get-products

# Test both integration methods
npm run test:action get-products        # REST API
npm run test:action get-products-mesh   # API Mesh

# Performance comparison
npm run test:performance
```

### **Mock Commerce API**

```javascript
// For testing without live Commerce instance
const mockCommerceAPI = {
  products: mockProductData,
  categories: mockCategoryData,
  inventory: mockInventoryData
};
```

## Related Documentation

- **[API Mesh Integration](../development/api-mesh-integration.md)** - Complete API Mesh implementation
- **[HTTP Bridge Pattern](http-bridge-pattern.md)** - Architecture pattern details
- **[Configuration System](../development/configuration.md)** - Environment configuration
- **[Adobe App Builder](adobe-app-builder.md)** - Platform integration patterns

---

_This document provides comprehensive coverage of Adobe Commerce integration patterns and architecture decisions._
