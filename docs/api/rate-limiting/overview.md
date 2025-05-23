# Rate Limiting Overview

## Introduction

The Adobe Commerce Integration Service implements rate limiting to ensure service stability and fair resource usage across all clients.

## Rate Limits

| Endpoint | Rate Limit | Window | Notes |
|----------|------------|--------|-------|
| Product Export | 5 requests | per minute | Per store view |
| Status Check | 60 requests | per minute | Global limit |
| File Download | 10 requests | per minute | Per IP address |
| Authentication | 30 requests | per minute | Per client ID |

## Response Headers

Every API response includes rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1623456789
```

## Rate Limit Exceeded

When you exceed the rate limit:

```http
Status: 429 Too Many Requests
Retry-After: 30
```

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 30 seconds.",
    "retryAfter": 30
  }
}
```

## Client Implementation

### Basic Rate Limit Handling

```javascript
class ApiClient {
  async makeRequest() {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        await this.wait(retryAfter * 1000);
        return this.makeRequest();
      }
      
      return response;
    } catch (error) {
      // Handle error
    }
  }
}
```

### Advanced Implementation

For detailed implementation guidelines, see [Rate Limiting Best Practices](best-practices.md).

## Optimization Strategies

1. Request Optimization
   - Batch operations where possible
   - Cache responses
   - Use conditional requests

2. Rate Tracking
   - Monitor remaining limits
   - Track usage patterns
   - Implement alerts

3. Error Handling
   - Implement backoff strategies
   - Queue requests when needed
   - Handle failures gracefully

## Monitoring

### Key Metrics
- Requests per minute
- Rate limit errors
- Average response time
- Queue length

### Health Checks
- Monitor rate limit headers
- Track error responses
- Alert on high usage

## Best Practices

1. Implement proper retries
2. Use exponential backoff
3. Cache responses when possible
4. Monitor usage patterns
5. Handle errors gracefully

For detailed implementation strategies, see our [Best Practices Guide](best-practices.md). 