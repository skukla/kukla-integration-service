# API Reference

[← Back to README](../README.md)

## Overview

This guide documents the API endpoints and integration patterns. For implementation details, see:
- [Development Guide](development.md)
- [Error Handling](error-handling.md)
- [Performance Guide](performance.md)

## Core APIs

### Product Management

#### `GET /api/products`
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

**Error Handling:**
See [Error Types](error-handling.md#error-types) for details.

#### `POST /api/products/export`
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

### File Operations

#### `GET /api/files`
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

#### `POST /api/files/upload`
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
  'HX-Retarget': string     // New target selector
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