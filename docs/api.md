# API Documentation

## Error Handling

All API endpoints follow a consistent error handling pattern:

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

## Endpoints

### File Operations

#### GET /api/v1/web/kukla-integration-service/files
Lists available files.

**Possible Errors:**
- 401: Authentication required
- 403: No access to file list
- 500: System error

#### POST /api/v1/web/kukla-integration-service/files/upload
Uploads a new file.

**Possible Errors:**
- 400: Invalid file format
- 401: Authentication required
- 403: No upload permission
- 429: Upload rate limit
- 500: Upload failed

#### DELETE /api/v1/web/kukla-integration-service/files/{id}
Deletes a file.

**Possible Errors:**
- 400: Invalid file ID
- 401: Authentication required
- 403: No delete permission
- 404: File not found
- 500: Deletion failed

### Commerce Integration

#### GET /api/v1/web/kukla-integration-service/commerce/products
Lists commerce products.

**Possible Errors:**
- 401: Commerce auth required
- 403: No product access
- 429: API rate limit
- 500: Commerce API error

#### POST /api/v1/web/kukla-integration-service/commerce/export
Exports products to files.

**Possible Errors:**
- 400: Invalid export config
- 401: Commerce auth required
- 403: No export permission
- 429: Export rate limit
- 500: Export failed

## HTMX Integration

HTMX responses include additional headers for enhanced functionality:

```javascript
{
  headers: {
    'HX-Retryable': 'true',       // For retryable errors
    'HX-Reswap': 'none',          // Prevent content swap on error
    'HX-Reswap-Delay': '2s'       // Delay before retry
  }
}
```

### Response Types

1. **HTML Response** (Success)
   ```http
   200 OK
   Content-Type: text/html
   ```

2. **Error Response** (Failure)
   ```http
   400 Bad Request
   Content-Type: application/json
   HX-Retryable: true
   ```

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