# Product Export API

## Overview

The Product Export API allows you to export product data from Adobe Commerce in various formats.

## Endpoints

### Start Export

```http
POST /api/products/export
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fields | string[] | No | List of fields to export |
| format | string | No | Export format (default: 'csv') |
| filters | object | No | Product filters |
| storeId | string | Yes | Store view identifier |

#### Example Request
```json
{
  "fields": ["sku", "name", "price", "description"],
  "format": "csv",
  "filters": {
    "status": "enabled",
    "type": "simple"
  },
  "storeId": "1"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "jobId": "export_12345",
    "status": "processing",
    "estimatedTime": 120
  }
}
```

### Check Export Status

```http
GET /api/products/export/{jobId}
```

#### Response
```json
{
  "success": true,
  "data": {
    "jobId": "export_12345",
    "status": "completed",
    "progress": 100,
    "downloadUrl": "https://..."
  }
}
```

### Download Export File

```http
GET /api/products/export/{jobId}/download
```

#### Response Headers
```http
Content-Type: text/csv
Content-Disposition: attachment; filename="products_export.csv"
```

## Error Responses

### Invalid Parameters
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid field selection"
  }
}
```

### Export Failed
```json
{
  "success": false,
  "error": {
    "code": "EXPORT_FAILED",
    "message": "Export process failed",
    "details": {
      "reason": "Database connection error"
    }
  }
}
```

## Rate Limiting

See [Rate Limiting Overview](../rate-limiting/overview.md) for details.

## Best Practices

1. Field Selection
   - Only request needed fields
   - Use field groups when available
   - Consider response size

2. Filtering
   - Use specific filters
   - Combine filters effectively
   - Test filter combinations

3. Export Process
   - Monitor job status
   - Implement retry logic
   - Handle partial success

## Examples

### Basic Export
```javascript
async function exportProducts() {
  // Start export
  const response = await api.post('/products/export', {
    fields: ['sku', 'name', 'price'],
    storeId: '1'
  });

  const { jobId } = response.data;

  // Check status
  while (true) {
    const status = await api.get(`/products/export/${jobId}`);
    if (status.data.status === 'completed') {
      return status.data.downloadUrl;
    }
    await sleep(5000); // Wait 5 seconds
  }
}
```

### Filtered Export
```javascript
const filters = {
  status: 'enabled',
  price: { gte: 100 },
  categories: { in: ['4', '5', '6'] }
};

const response = await api.post('/products/export', {
  fields: ['sku', 'name', 'price'],
  filters,
  storeId: '1'
});
```

## Related Documentation

- [API Overview](../overview.md)
- [Authentication](../authentication/overview.md)
- [Rate Limiting](../rate-limiting/overview.md) 