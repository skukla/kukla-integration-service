# HTTP Bridge Architecture Pattern

## Overview

The HTTP Bridge Pattern is a proven architectural approach for integrating API Mesh with Adobe App Builder while eliminating code duplication and maintaining perfect functionality parity.

## Pattern Definition

**HTTP Bridge Pattern**: A custom GraphQL resolver that delegates complex business logic to existing REST actions via HTTP calls, rather than embedding duplicate logic within the resolver itself.

## Architecture Diagram

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Request  │ -> │   API Mesh      │ -> │ HTTP Bridge     │ -> │  REST Action    │
│                 │    │   GraphQL       │    │  Resolver       │    │  (Existing)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       |                         |
                                                   60 lines                 All business
                                                  HTTP client                    logic
                                                      ↓                          ↓
                                              ┌─────────────────┐    ┌─────────────────┐
                                              │ Single GraphQL  │    │ 200+ Commerce   │
                                              │    Query        │    │  API Calls      │
                                              └─────────────────┘    └─────────────────┘
```

## Benefits Analysis

### Quantitative Benefits

| Metric | Embedded Logic | HTTP Bridge | Improvement |
|--------|----------------|-------------|-------------|
| **Code Lines** | 273 lines | 60 lines | **78% reduction** |
| **Maintenance Points** | 2 locations | 1 location | **50% reduction** |
| **CSV Output** | Identical | Identical | **Perfect parity** |
| **Performance Impact** | 0ms | ~50ms | **<1% overhead** |

### Qualitative Benefits

✅ **Zero Code Duplication**: Single source of truth eliminates maintenance burden  
✅ **Automatic Synchronization**: REST API improvements propagate automatically  
✅ **Standard Debugging**: HTTP patterns everyone understands  
✅ **Constraint Elimination**: Bypasses API Mesh resolver limitations  
✅ **Future-Proof**: New REST features automatically available in mesh

## Problem Statement

### API Mesh Constraints

API Mesh custom resolvers have significant limitations:

```javascript
// ❌ These don't work in API Mesh resolvers:
const { getAuthToken } = require('../../../src/commerce/auth');     // Module import fails
const utils = require('../../../src/core/utils');                 // Cannot access project utilities
const config = `Commerce URL: ${baseUrl}/products`;               // Template literals limited
```

### Embedded Logic Problems

Without HTTP Bridge, resolvers must embed all logic:

```javascript
// ❌ Embedded logic approach (273 lines)
module.exports = {
  resolvers: {
    Query: {
      mesh_products_full: {
        resolve: async (parent, args, context) => {
          // 50+ lines of auth logic (duplicated from src/commerce/auth.js)
          // 80+ lines of product fetching (duplicated from src/commerce/products.js)
          // 40+ lines of inventory enrichment (duplicated)
          // 30+ lines of category enrichment (duplicated)
          // 50+ lines of data transformation (duplicated)
          // = 250+ lines of duplicated code
        }
      }
    }
  }
};
```

## HTTP Bridge Implementation

### Resolver Implementation

```javascript
// ✅ HTTP Bridge approach (60 lines)
const REST_ACTION_URL = 'https://stage.adobeio-static.net/api/v1/web/kukla-integration-service/get-products';

module.exports = {
  resolvers: {
    Query: {
      mesh_products_full: {
        resolve: async (parent, args, context) => {
          try {
            // Credentials from headers
            const username = context.headers['x-commerce-username'];
            const password = context.headers['x-commerce-password'];
            
            // Single HTTP call to existing REST action
            const response = await fetch(REST_ACTION_URL + '?format=json', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            
            // Transform to GraphQL format
            return {
              products: data.products || [],
              total_count: data.total_count || 0,
              message: data.message || 'Success via HTTP bridge',
              status: 'success'
            };
          } catch (error) {
            return {
              products: [],
              total_count: 0,
              message: 'Error: ' + error.message,
              status: 'error'
            };
          }
        }
      }
    }
  }
};
```

### REST Action Enhancement

```javascript
// Enhanced REST action with JSON format support
async function main(params) {
  // ... existing business logic ...
  
  const format = actionParams.format || 'csv';

  if (format === 'json') {
    // Return structured data for HTTP bridge
    return response.success({
      products: builtProducts,
      total_count: builtProducts.length,
      message: 'Successfully fetched products',
      status: 'success'
    });
  }

  // Default CSV format (unchanged)
  // ... existing CSV logic ...
}
```

## Performance Analysis

### Network Overhead

```text
Traditional Flow:
User → API Mesh → Commerce API (200+ calls) = ~6-8 seconds

HTTP Bridge Flow:
User → API Mesh → REST Action → Commerce API (200+ calls) = ~6-8 seconds + 50ms bridge
```

**Result**: <1% performance impact for 78% code reduction

### Call Pattern Comparison

| Pattern | GraphQL Calls | HTTP Calls | Commerce Calls | Total Network |
|---------|---------------|------------|----------------|---------------|
| **Direct Mesh** | 1 | 0 | 200+ | 201+ calls |
| **HTTP Bridge** | 1 | 1 | 200+ | 202+ calls |
| **Overhead** | 0 | +1 | 0 | **+0.5%** |

## Implementation Guidelines

### When to Use HTTP Bridge

✅ **Use HTTP Bridge when:**

- Complex business logic exists in REST actions
- Code duplication would exceed 100+ lines
- Multiple utilities/modules need to be accessed
- Perfect parity with existing functionality required

❌ **Don't use HTTP Bridge when:**

- Simple data transformation (< 50 lines)
- Mesh-specific logic with no REST equivalent
- Real-time requirements where 50ms matters
- Network calls must be minimized

### REST Action Requirements

For HTTP Bridge compatibility, REST actions must:

1. **Support JSON format**: Add `format` parameter handling
2. **Return structured data**: Consistent response format
3. **Handle query parameters**: GET method compatibility
4. **Provide error details**: Structured error responses

### Mesh Action Optimization

When using HTTP Bridge:

```javascript
// ✅ CORRECT: Skip transformation for bridge data
const builtProducts = products; // Already transformed by REST action

// ❌ WRONG: Double transformation breaks data
const builtProducts = await buildProducts(products, config); // Duplicates work
```

## Testing and Validation

### Output Verification

```bash
# Test both methods
node scripts/test-action.js get-products        # REST: 119 products, 15.48 KB
node scripts/test-action.js get-products-mesh   # Bridge: 119 products, 15.48 KB

# Verify identical output
curl -s "$REST_URL" > rest_output.csv
curl -s "$MESH_URL" > mesh_output.csv
diff rest_output.csv mesh_output.csv            # Should show no differences
```

### Performance Testing

```bash
# Measure end-to-end performance
time node scripts/test-action.js get-products      # Baseline
time node scripts/test-action.js get-products-mesh # Bridge overhead
```

## Alternative Patterns (Analysis)

### Code Generation Pattern

**Concept**: Auto-generate mesh resolver from REST action code

❌ **Problems:**

- AST parsing complexity (~650 lines)
- Build-time dependencies
- Meta-programming maintenance burden
- Over-engineering for simple HTTP problem

### Shared Library Pattern

**Concept**: Extract common logic to shared library

❌ **Problems:**

- API Mesh cannot import Node.js modules
- Resolver environment limitations
- Still requires code duplication

### Microservice Pattern

**Concept**: Extract logic to separate microservice

❌ **Problems:**

- Infrastructure complexity
- Additional deployment overhead
- Network latency multiplication

## Future Considerations

### Scaling the Pattern

As the application grows:

1. **Multiple Bridge Points**: Each complex REST action gets bridge support
2. **Format Standardization**: Consistent JSON response formats
3. **Error Handling**: Unified error response patterns
4. **Monitoring**: Track bridge call performance

### Performance Optimization

Potential optimizations:

1. **Response Caching**: Cache bridge responses at mesh level
2. **Parallel Bridges**: Multiple bridge calls in parallel
3. **Smart Routing**: Route simple queries direct, complex via bridge

## Best Practices

### Implementation

1. **Always verify identical output** when implementing bridges
2. **Add JSON format support** to existing REST actions first
3. **Skip duplicate transformations** in mesh actions
4. **Use GET with query parameters** for staging compatibility

### Maintenance

1. **Document bridge relationships** for future developers
2. **Test both paths** (REST and bridge) during development
3. **Monitor bridge performance** in production
4. **Update documentation** when adding new bridges

### Architecture

1. **Prefer HTTP Bridge** over embedded logic for complex cases
2. **Keep resolvers simple** - they should delegate, not implement
3. **Maintain single source of truth** in REST actions
4. **Design for consistency** across all bridge implementations

## Conclusion

The HTTP Bridge Pattern provides an elegant solution to API Mesh integration challenges by:

- **Eliminating code duplication** through delegation
- **Maintaining perfect parity** with existing functionality  
- **Reducing maintenance burden** to a single codebase
- **Providing standard debugging** through HTTP patterns
- **Enabling automatic synchronization** of improvements

This pattern should be the default approach for complex API Mesh integrations in Adobe App Builder applications.
