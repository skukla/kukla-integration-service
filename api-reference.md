# API Reference

[← Back to README](../README.md) | Documentation: API Reference

---

## Overview

This document provides detailed information about all available API endpoints in the Adobe Commerce Integration Service.

## Backend Actions

### Product Export API

#### `GET /api/get-products`
Retrieves products from Adobe Commerce.

**Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `filters` (optional): Product filtering criteria

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total_count": 100,
    "page_info": {
      "current_page": 1,
      "page_size": 20,
      "total_pages": 5
    }
  }
}
```

#### `POST /api/download-file`
Initiates file download process.

**Request Body:**
```json
{
  "file_id": "string",
  "format": "csv|json"
}
```

**Response:**
```json
{
  "success": true,
  "download_url": "string",
  "expires_at": "ISO8601 timestamp"
}
```

## Frontend Actions

### File Management API

#### `GET /api/browse-files`
Lists available files.

**Parameters:**
- `type` (optional): Filter by file type
- `sort` (optional): Sort criteria

**Response:** HTML fragment for HTMX integration

#### `POST /api/delete-file`
Deletes specified file.

**Request Body:**
```json
{
  "file_id": "string"
}
```

**Response:** HTML fragment confirming deletion

## Shared Utilities

### Authentication

All API endpoints require authentication via Adobe App Builder. Include the following headers:

```
Authorization: Bearer <jwt_token>
x-gw-ims-org-id: <org_id>
```

### Error Responses

Standard error format:
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

Common error codes:
- `AUTH_ERROR`: Authentication failed
- `INVALID_REQUEST`: Invalid parameters
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error

### Rate Limiting

- Default: 100 requests per minute
- Bulk operations: 10 requests per minute
- Headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## HTMX Integration

### Response Types

Frontend actions return HTML fragments with specific HTMX attributes:

```html
<div hx-swap-oob="true" id="file-list">
  <!-- Updated content -->
</div>
```

### Event Triggers

Common HTMX events used:
- `htmx:beforeRequest`
- `htmx:afterRequest`
- `htmx:responseError`

## Adobe Commerce Integration

### Authentication Flow

1. OAuth2 token acquisition
2. Commerce API integration
3. Token refresh handling

### Data Synchronization

- Real-time updates
- Batch processing
- Error handling and retries

## Development Guidelines

### Testing Endpoints

1. Use provided Postman collection
2. Test with mock data
3. Validate responses
4. Check error scenarios

### Security Considerations

- Input validation
- Output sanitization
- Rate limiting
- Authentication checks

## Monitoring and Logging

### Request Logging

All API requests are logged with:
- Timestamp
- Endpoint
- Request parameters
- Response status
- Execution time

### Error Tracking

Errors are logged with:
- Stack traces
- Context data
- User information
- System state 