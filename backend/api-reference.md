# API Reference

[← Back to README](../README.md)

## Overview

This guide documents the API endpoints, integration patterns, and implementation details. For related guides, see:
- [Development Guide](development.md)
- [Error Handling](error-handling.md)
- [Performance Guide](performance.md)

## Base URL

All API endpoints are prefixed with: `/api/v1/web/kukla-integration-service`

## Error Handling

### Response Format

#### Success Response
```javascript
{
  statusCode: 200,
  body: {
    success: true,
    message: "Operation successful",
    data: {
      // Operation-specific data
    }
  }
}
```

#### Error Response
```javascript
{
  statusCode: <HTTP_STATUS_CODE>,
  body: {
    success: false,
    error: {
      code: <ERROR_CODE>,
      message: <USER_FRIENDLY_MESSAGE>,
      action: <SUGGESTED_ACTION>,
      canRetry: <BOOLEAN>,
      context: {
        errorType: <ERROR_TYPE>,
        // Additional debug information
      }
    }
  }
}
```

### Status Codes

| Code | Description | Retry | Example |
|------|-------------|-------|---------|
| 400  | Validation Error | Yes | Invalid file format |
| 401  | Authentication Error | No | Session expired |
| 403  | Authorization Error | No | Insufficient permissions |
| 404  | Not Found | No | File not found |
| 429  | Rate Limit | Yes | Too many requests |
| 500  | System Error | Yes | Service unavailable |

### Error Codes

| Code | Description | Example Context |
|------|-------------|----------------|
| VALIDATION_ERROR | Input validation failed | Field errors |
| AUTHENTICATION_ERROR | Auth failure | Token expiry |
| AUTHORIZATION_ERROR | Permission denied | Required roles |
| NOT_FOUND | Resource not found | Resource ID |
| RATE_LIMIT | Rate limit exceeded | Limit details |
| SYSTEM_ERROR | Internal error | Error trace |

## Core APIs

### Product Management

#### GET /products
Retrieves product data from Adobe Commerce.

**Parameters:**
```javascript
{
  page: number,      // Page number (default: 1)
  limit: number,     // Items per page (default: 20)
  filters: {         // Optional filters
    sku: string,
    status: string
  }
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    items: Product[],
    total: number,
    page: number
  }
}
```

**Possible Errors:**
- 401: Commerce auth required
- 403: No product access
- 429: API rate limit
- 500: Commerce API error

#### POST /products/export
Exports products to a file.

**Request:**
```javascript
{
  format: 'csv' | 'json',
  filters: {
    sku: string,
    status: string
  }
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    fileId: string,
    downloadUrl: string,
    expiresAt: string
  }
}
```

**Possible Errors:**
- 400: Invalid export config
- 401: Commerce auth required
- 403: No export permission
- 429: Export rate limit
- 500: Export failed

### File Operations

#### GET /files
Lists available files.

**Parameters:**
```javascript
{
  type: string,      // File type filter
  sort: string       // Sort criteria
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    files: File[],
    total: number
  }
}
```

**Possible Errors:**
- 401: Authentication required
- 403: No access to file list
- 500: System error

#### POST /files/upload
Uploads a new file.

**Request:**
```javascript
// multipart/form-data
{
  file: File,
  type: string,
  metadata: object
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    fileId: string,
    url: string
  }
}
```

**Possible Errors:**
- 400: Invalid file format
- 401: Authentication required
- 403: No upload permission
- 429: Upload rate limit
- 500: Upload failed

#### DELETE /files/{id}
Deletes a file.

**Possible Errors:**
- 400: Invalid file ID
- 401: Authentication required
- 403: No delete permission
- 404: File not found
- 500: Deletion failed

## HTMX Integration

### Response Format

All HTMX responses follow this pattern:
```html
<div id="target-id" 
     data-context="operation-context">
  <!-- Response content -->
</div>
```

### Response Headers

```javascript
{
  'HX-Trigger': string,     // Client event to trigger
  'HX-Redirect': string,    // Redirect URL
  'HX-Refresh': boolean,    // Page refresh flag
  'HX-Retarget': string,    // New target selector
  'HX-Retryable': 'true',   // For retryable errors
  'HX-Reswap': 'none',      // Prevent content swap on error
  'HX-Reswap-Delay': '2s'   // Delay before retry
}
```

For header usage, see [HTMX Guide](htmx.md#response-headers).

### Error Responses

Error responses include:
```html
<div class="error-container"
     data-error-type="validation">
  <div class="error-message">
    <!-- Error details -->
  </div>
  <div class="error-action">
    <!-- Action buttons -->
  </div>
</div>
```

For error patterns, see [Error Handling](error-handling.md#error-patterns).

### Event Handling

HTMX events are handled consistently:

1. **Before Request**
   - Show loading state
   - Disable form submission

2. **After Request**
   - Hide loading state
   - Show success/error notification
   - Enable form submission

3. **On Error**
   - Display error notification
   - Show retry button if applicable
   - Maintain form state

## Security

All endpoints require:
- Adobe App Builder authentication
- Valid API tokens
- CSRF protection

For security details, see [Security Guide](security.md).

## Performance

APIs implement:
- Response caching
- Compression
- Rate limiting
- Timeout handling

For optimization details, see [Performance Guide](performance.md). 