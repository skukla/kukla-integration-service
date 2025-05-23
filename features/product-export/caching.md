# Caching Strategy

## Overview

The product export feature implements a multi-level caching strategy to optimize performance and reduce load on the Adobe Commerce API.

## Cache Levels

### 1. Product Data Cache
- Cache Duration: 24 hours
- Storage: App Builder State Store
- Key Format: `products:${storeId}:${timestamp}`

### 2. Export Job Cache
- Cache Duration: 1 hour
- Storage: Memory Cache
- Key Format: `export:${jobId}`

### 3. Download URL Cache
- Cache Duration: 15 minutes
- Storage: Redis
- Key Format: `download:${fileId}`

## Implementation

### Cache Keys
```javascript
function generateCacheKey(type, identifier) {
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // hourly timestamp
  return `${type}:${identifier}:${timestamp}`;
}
```

### Cache Operations

#### Write
```javascript
async function cacheProducts(products, storeId) {
  const key = generateCacheKey('products', storeId);
  await cache.set(key, products, {
    ttl: 24 * 60 * 60 // 24 hours
  });
}
```

#### Read
```javascript
async function getProductsFromCache(storeId) {
  const key = generateCacheKey('products', storeId);
  return await cache.get(key);
}
```

## Invalidation Strategy

1. Time-based Invalidation
   - Automatic expiration based on TTL
   - Graceful degradation to API calls

2. Manual Invalidation
   - Admin-triggered cache clear
   - Product update webhooks
   - Force refresh parameter

## Performance Impact

| Operation | Without Cache | With Cache |
|-----------|--------------|------------|
| Product List | 2000ms | 200ms |
| Export Job | 5000ms | 500ms |
| Download URL | 1000ms | 100ms |

## Monitoring

### Cache Metrics
- Hit Rate
- Miss Rate
- Eviction Rate
- Memory Usage

### Health Checks
```javascript
async function checkCacheHealth() {
  try {
    const testKey = 'health-check';
    await cache.set(testKey, 'test');
    const value = await cache.get(testKey);
    await cache.delete(testKey);
    return value === 'test';
  } catch (error) {
    return false;
  }
}
```

## Error Handling

### Cache Failures
```javascript
async function getProductsWithFallback(storeId) {
  try {
    const cached = await getProductsFromCache(storeId);
    if (cached) return cached;
  } catch (error) {
    logger.warn('Cache read failed', { error });
  }
  
  // Fallback to API
  return await fetchProductsFromApi(storeId);
}
```

## Best Practices

1. Cache Warming
   - Implement background refresh
   - Pre-cache popular items
   - Maintain cache freshness

2. Memory Management
   - Monitor cache size
   - Implement LRU eviction
   - Set appropriate TTLs

3. Consistency
   - Version cache keys
   - Handle stale data
   - Implement cache stampede protection 