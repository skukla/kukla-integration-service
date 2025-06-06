# API Overview

## Introduction

The Adobe Commerce Integration Service provides a RESTful API for integrating with Adobe Commerce. This documentation covers the API endpoints, authentication, rate limiting, and best practices.

## Base URL

```plaintext
https://api.commerce.adobe.io/integration-service/v1
```

## Authentication

All API requests require authentication using Adobe I/O tokens. See the [Authentication Guide](authentication/overview.md) for details.

## Rate Limiting

The API implements rate limiting to ensure service stability. See the [Rate Limiting Guide](rate-limiting/overview.md) for details.

## Available Endpoints

### Product Export

- [Product Export API](endpoints/product-export.md) - Export product data in various formats

## Response Format

All API responses follow this standard format:

```json
{
  "success": boolean,
  "data": object | array | null,
  "error": {
    "code": string,
    "message": string,
    "details": object | null
  } | null
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid parameters |
| 401  | Unauthorized - Invalid or missing token |
| 403  | Forbidden - Insufficient permissions |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |

## Best Practices

1. Always check response status codes
2. Implement proper error handling
3. Respect rate limits
4. Use pagination for large datasets
5. Cache responses when appropriate

## Tools and SDKs

- [Postman Collection](https://github.com/adobe/commerce-integration-service/tree/main/tools/postman)
- [JavaScript SDK](https://github.com/adobe/commerce-integration-sdk-js)

## Support

For API support:

1. Check the documentation
2. Review common issues in [Troubleshooting](../maintenance/troubleshooting.md)
3. Contact Adobe Support

```javascript
// ... existing code ...
```
