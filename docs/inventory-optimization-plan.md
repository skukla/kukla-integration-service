# Inventory API Call Optimization Plan

## Executive Summary

The current inventory fetching implementation makes 119 individual API calls for 119 products, causing severe performance degradation. This plan outlines a fix to reduce API calls by 97.5% using batch queries.

## Problem Statement

**Current Implementation Issues**:
- `lib/commerce/inventory.js:31-61` makes one API call per product SKU
- 119 products = 119 API calls (despite batching into groups of 50)
- Each call uses `condition_type=eq` for single SKU lookup
- Significant latency and API quota consumption

**Impact**:
- Slow product export performance
- Excessive API usage
- Poor cache efficiency
- Scalability concerns for larger catalogs

## Root Cause Analysis

```javascript
// PROBLEM: Current implementation in fetchInventoryForProducts
const inventoryPromises = products.map(async (product) => {
  // This creates one API call per product!
  const url = `${baseUrl}/rest/${api.version}/inventory/source-items?${buildSearchCriteria('sku', product.sku)}`;
  const response = await fetch(url, {...});
});
```

The function receives a batch of 50 products but still makes 50 individual API calls.

## Proposed Solution

Implement batch inventory fetching using Adobe Commerce's `condition_type=in` parameter, following the pattern successfully used in `lib/commerce/categories.js`.

## Technical Implementation

### 1. API Call Pattern Change

**Before** (Individual calls):
```
GET /inventory/source-items?
  searchCriteria[filter_groups][0][filters][0][field]=sku
  &searchCriteria[filter_groups][0][filters][0][value]=SKU123
  &searchCriteria[filter_groups][0][filters][0][condition_type]=eq
```

**After** (Batch call):
```
GET /inventory/source-items?
  searchCriteria[filter_groups][0][filters][0][field]=sku
  &searchCriteria[filter_groups][0][filters][0][value]=SKU1,SKU2,SKU3,...,SKU50
  &searchCriteria[filter_groups][0][filters][0][condition_type]=in
  &searchCriteria[pageSize]=50
```

### 2. Code Refactoring

**File**: `lib/commerce/inventory.js`

**New `fetchInventoryForProducts` implementation**:
```javascript
async function fetchInventoryForProducts(products, bearerToken, baseUrl, api, logger = null) {
  const log = logger || Core.Logger('commerce-inventory');
  
  // Extract all SKUs for batch query
  const skus = products.map(p => p.sku).join(',');
  
  // Build batch API URL
  const searchCriteria = 
    `searchCriteria[pageSize]=50` +
    `&searchCriteria[filter_groups][0][filters][0][field]=sku` +
    `&searchCriteria[filter_groups][0][filters][0][value]=${skus}` +
    `&searchCriteria[filter_groups][0][filters][0][condition_type]=in`;
  
  const url = `${baseUrl}/rest/${api.version}/inventory/source-items?${searchCriteria}`;
  
  // Single API call for all products
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${bearerToken}` }
  });
  
  // Process response and map back to products
  const inventoryMap = createInventoryMap(response.items);
  return mapInventoryToProducts(products, inventoryMap);
}
```

## Performance Improvements

| Metric | Current | After Fix | Improvement |
|--------|---------|-----------|-------------|
| API Calls (119 products) | 119 | 3 | -97.5% |
| API Calls (500 products) | 500 | 10 | -98% |
| Estimated Response Time | ~12s | ~2s | -83% |
| Cache Efficiency | Poor | Excellent | - |

## Implementation Steps

1. **Update `fetchInventoryForProducts` function**
   - Remove `products.map()` pattern
   - Implement single batch fetch
   - Add response mapping logic

2. **Add helper functions**
   - `createInventoryMap(items)` - Create SKU to inventory lookup
   - `mapInventoryToProducts(products, inventoryMap)` - Map inventory to products

3. **Update error handling**
   - Handle batch response errors
   - Provide fallback for missing SKUs
   - Add comprehensive logging

4. **Testing**
   - Unit tests for batch functionality
   - Integration tests with real API
   - Performance benchmarking

## Testing Strategy

### Functional Tests
- Verify inventory accuracy for all products
- Test edge cases (missing SKUs, empty batches)
- Validate inventory aggregation logic

### Performance Tests
- Measure API call reduction
- Compare execution times
- Monitor memory usage

### Integration Tests
- Test with various batch sizes
- Verify compatibility with existing code
- Test cache integration

## Rollout Plan

1. **Phase 1**: Development and testing in local environment
2. **Phase 2**: Deploy to staging for validation
3. **Phase 3**: Performance testing with production-like data
4. **Phase 4**: Production deployment with monitoring

## Success Metrics

- API calls reduced by >95%
- Product export time reduced by >50%
- Zero functional regressions
- Improved cache hit rates

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API doesn't support batch queries | Already validated in API Mesh config |
| Response size too large | Implement pagination if needed |
| Breaking existing functionality | Comprehensive test coverage |
| Performance degradation | Benchmark before deployment |

## References

- Categories implementation: `lib/commerce/categories.js:34-69`
- API Mesh config: `mesh/config.js` (inventory_batch endpoint)
- Adobe Commerce API documentation: Batch query support

## Next Steps

1. Create feature branch for development
2. Implement solution in `lib/commerce/inventory.js`
3. Add unit and integration tests
4. Deploy to staging for validation
5. Monitor performance improvements
6. Deploy to production

---

*This plan addresses the critical performance issue identified in the inventory fetching logic, providing a clear path to reduce API calls by 97.5% while maintaining functionality.*