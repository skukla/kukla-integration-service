# Performance Optimization Guide

[← Back to README](../README.md) | Documentation: Performance

## Core Optimizations

### Response Caching

The application implements a standardized caching system through the `actions/core/cache.js` module:

```javascript
const response = await someAction();
const cachedResponse = addCacheHeaders(response, {
  maxAge: 3600,        // Cache for 1 hour
  public: true,        // Allow public caching
  noCache: false       // Enable caching
});
```

#### Cache Durations

- Short (60s): Dynamic HTML content
- Medium (300s): API responses
- Long (3600s): Semi-static content
- Very Long (86400s): Static assets

#### Cache Control

- Public vs Private caching
- No-cache directives for sensitive data
- Content-type based cache durations

### Response Compression

Automatic response compression is handled by `actions/core/compression.js`:

```javascript
const response = await someAction();
const compressedResponse = await addCompression(response, {
  acceptEncoding: request.headers['accept-encoding']
});
```

#### Compression Features

- Automatic content-type detection
- Size-based compression (>1KB)
- GZIP and Deflate support
- Client capability detection

### Performance Monitoring

Performance tracking via `actions/core/performance.js`:

```javascript
const metrics = new PerformanceMetrics(logger);
metrics.start('operation-name');
// ... operation ...
metrics.end('operation-name', { context: 'additional info' });
```

#### Monitored Metrics

- Response times
- Memory usage
- File operations
- Commerce API calls

## Best Practices

### Response Optimization

1. Use appropriate cache durations
2. Enable compression for large responses
3. Monitor performance metrics
4. Set proper cache headers

### Resource Management

1. Clean up resources properly
2. Monitor memory usage
3. Use compression when beneficial
4. Implement proper timeouts

### Error Handling

1. Don't cache error responses
2. Compress error details if large
3. Include performance context
4. Monitor error patterns

## Implementation Examples

### Basic Response

```javascript
const response = {
  statusCode: 200,
  body: { data }
};

// Add cache headers
const cachedResponse = addCacheHeaders(response, {
  maxAge: CacheConfig.DURATIONS.MEDIUM
});

// Add compression if needed
const finalResponse = await addCompression(cachedResponse, {
  acceptEncoding: request.headers['accept-encoding']
});
```

### Performance Monitoring

```javascript
const performanceMiddleware = createPerformanceMiddleware(logger);

const handler = async (params) => {
  // Your action logic
};

// Wrap handler with performance monitoring
const monitoredHandler = (params) => performanceMiddleware(params, handler);
```

### Caching Strategy

```javascript
// Static content
addCacheHeaders(response, {
  maxAge: CacheConfig.DURATIONS.VERY_LONG,
  public: true
});

// Dynamic content
addCacheHeaders(response, {
  maxAge: CacheConfig.DURATIONS.SHORT,
  public: false
});

// No caching
addCacheHeaders(response, {
  noCache: true
});
```

## Monitoring and Debugging

### Performance Logs

Performance metrics are automatically logged:

```json
{
  "level": "info",
  "message": "Performance metric",
  "operation": "get-products",
  "type": "response_time",
  "duration": 123.45,
  "memory": {
    "heapUsed": 1024,
    "heapTotal": 4096,
    "external": 0
  }
}
```

### Cache Headers

Example of cache headers in response:

```http
Cache-Control: public, max-age=3600
Content-Type: application/json
Content-Encoding: gzip
Vary: Accept-Encoding
```

## Next Steps

1. Monitor performance metrics
2. Adjust cache durations based on usage
3. Fine-tune compression thresholds
4. Review and optimize as needed
