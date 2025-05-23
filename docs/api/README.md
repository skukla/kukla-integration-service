# API Documentation

This directory contains detailed API documentation for all endpoints and services.

## Endpoints

- [Product Export API](product-export.md) - Documentation for the product export endpoints
- [Authentication](authentication.md) - Authentication and authorization details
- [Rate Limiting](rate-limiting.md) - API rate limiting policies and guidelines

## Response Formats

All API endpoints return responses in the following format:

```json
{
  "success": boolean,
  "message": string,
  "data": object|array,
  "error": object|null
}
```

## Error Handling

Standard error codes and their meanings:
- 400: Bad Request - Invalid parameters
- 401: Unauthorized - Missing or invalid authentication
- 403: Forbidden - Insufficient permissions
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Server-side issue

## Versioning

API versioning follows semantic versioning principles. Breaking changes will result in a new major version. 