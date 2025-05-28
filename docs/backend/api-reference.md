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

**Authentication Parameters:**

```javascript
{
  commerce_url: string,           // Adobe Commerce instance URL
  commerce_admin_username: string, // Admin username
  commerce_admin_password: string  // Admin password
}
```

Note: Authentication parameters can be provided in either lowercase (commerce_url) or uppercase (COMMERCE_URL) format.

**Optional Parameters:**

```javascript
{
  fields: string,           // Comma-separated list of fields to include
  include_inventory: boolean, // Include inventory data
  include_categories: boolean // Include category data
}
```

**Testing Environments:**

1. Local Development:

```bash
# Base URL for local testing
http://localhost:9080/api/v1/web/kukla-integration-service/get-products
```

2. Production:

```bash
# Base URL for production testing
https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service/get-products
```

**Example Requests:**

1. Local Testing:

```bash
# Basic request with URL-encoded parameters
curl -X POST "http://localhost:9080/api/v1/web/kukla-integration-service/get-products?commerce_url=https://your-commerce-instance.com&commerce_admin_username=admin&commerce_admin_password=your-password"

# Full featured request with JSON body
curl -X POST -H "Content-Type: application/json" -d '{
  "commerce_url": "https://your-commerce-instance.com",
  "commerce_admin_username": "admin",
  "commerce_admin_password": "your-password",
  "fields": "sku,name,price",
  "include_inventory": true,
  "include_categories": true
}' "http://localhost:9080/api/v1/web/kukla-integration-service/get-products"
```

2. Production Testing:

```bash
# Basic request with URL-encoded parameters
curl -X POST "https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service/get-products?commerce_url=https://your-commerce-instance.com&commerce_admin_username=admin&commerce_admin_password=your-password"

# Full featured request with JSON body
curl -X POST -H "Content-Type: application/json" -d '{
  "commerce_url": "https://your-commerce-instance.com",
  "commerce_admin_username": "admin",
  "commerce_admin_password": "your-password",
  "fields": "sku,name,price",
  "include_inventory": true,
  "include_categories": true
}' "https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service/get-products"
```

Note: If you deploy to a different namespace, replace the URL with your deployment URL.

**Response:**

```javascript
{
  statusCode: 200,
  body: {
    message: "Product export completed successfully.",
    file: {
      downloadUrl: string  // URL to download the CSV file containing all products
    },
    steps: string[]  // List of completed processing steps
  }
}
```

Note: Product data is only available through the CSV file download. The direct JSON response no longer includes the product data to improve performance and reduce response size.

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

## Get Products Endpoint

Exports product data from Adobe Commerce with optional enrichment and formatting.

### Endpoint

```http
POST /api/v1/web/kukla-integration-service/get-products
```

### Authentication

Required parameters (passed as query parameters or in request body):

- `commerce_url`: Adobe Commerce instance URL
- `commerce_admin_username`: Admin username
- `commerce_admin_password`: Admin password

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `fields` | string[] | All fields | Comma-separated list of fields to include. Available fields: `sku`, `name`, `price`, `qty`, `categories`, `images` |
| `include_inventory` | boolean | true | Whether to include inventory data |
| `include_categories` | boolean | true | Whether to include category data |
| `format` | string | "json" | Response format. Options: "json" or "csv" |

### Response Format

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Product export completed successfully.",
  "data": [
    {
      "sku": "product-sku",
      "name": "Product Name",
      "price": 99.99,
      "qty": 100,
      "categories": ["Category 1", "Category 2"],
      "images": [
        {
          "filename": "image.jpg",
          "url": "catalog/product/image.jpg",
          "position": 1,
          "roles": ["thumbnail", "small_image", "base_image"]
        }
      ]
    }
  ],
  "file": {
    "downloadUrl": "https://storage.url/products.csv"  // Only present if format=csv
  },
  "steps": [
    "Authentication successful",
    "Fetched X products from Adobe Commerce",
    "Enriched X products with inventory data",
    "Built category map with X categories",
    "Transformed X products",
    "Generated CSV content in memory",
    "Stored CSV file as 'filename.csv'"
  ]
}
```

#### Error Response (4xx/5xx)

```json
{
  "error": "Error message",
  "details": "Detailed error information (development mode only)",
  "steps": [
    "Step 1 completed",
    "Step 2 completed",
    "Error: Detailed error message"
  ]
}
```

### Examples

1. Basic request (all fields, JSON format):

```bash
curl -X POST "http://localhost:9080/api/v1/web/kukla-integration-service/get-products?commerce_url=https://your-store.com&commerce_admin_username=admin&commerce_admin_password=password"
```

2. Specific fields only:

```bash
curl -X POST "http://localhost:9080/api/v1/web/kukla-integration-service/get-products?commerce_url=https://your-store.com&commerce_admin_username=admin&commerce_admin_password=password&fields=sku,name,price"
```

3. CSV format with all data:

```bash
curl -X POST "http://localhost:9080/api/v1/web/kukla-integration-service/get-products?commerce_url=https://your-store.com&commerce_admin_username=admin&commerce_admin_password=password&format=csv"
```

4. Minimal data fetch:

```bash
curl -X POST "http://localhost:9080/api/v1/web/kukla-integration-service/get-products?commerce_url=https://your-store.com&commerce_admin_username=admin&commerce_admin_password=password&fields=sku,name&include_inventory=false&include_categories=false"
```

### Performance Considerations

1. Field Selection
   - Request only needed fields to reduce response size and processing time
   - The `qty` field requires additional API calls for inventory data
   - The `categories` field requires additional API calls for category data

2. Data Enrichment
   - `include_inventory=false` skips inventory API calls
   - `include_categories=false` skips category mapping
   - Both options can significantly improve response time for large catalogs

3. Response Format
   - JSON format returns data directly in the response
   - CSV format processes all data, generates a file, and returns a download URL
   - CSV generation may take longer but is better for large datasets

### Error Handling

Common error scenarios:

1. Missing or invalid authentication credentials
2. Invalid field names in the `fields` parameter
3. Commerce API connection issues
4. Rate limiting or timeout errors
5. Storage errors when generating CSV files
