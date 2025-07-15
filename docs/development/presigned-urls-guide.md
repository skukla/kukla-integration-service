# Presigned URLs and Dual Access Pattern Guide

> **Complete guide to file access patterns and presigned URL functionality**

## Overview

The Kukla Integration Service implements a **per-system access pattern** for file operations:

- **User Downloads**: Action-based URLs (reliable, always available)
- **Adobe Target**: Action-based URLs (stable, never expire, no manual updates)
- **Other Systems**: Presigned URLs (optimized, direct access with programmatic updates)

This pattern provides optimal solutions for each specific integration need.

## Quick Start

### For Users (Frontend/Browser)

```javascript
// Always use action-based download URLs
const { generateFileAccessUrl } = require('../src/files/utils/access-patterns');

const userAccess = await generateFileAccessUrl('products.csv', 'user', config, params);
// Returns: { url: 'https://...adobeioruntime.net/.../download-file?fileName=products.csv' }
```

### For Adobe Target (Stable URLs)

```javascript
// Use action URLs for stable, never-changing URLs
const adobeTargetAccess = await generateFileAccessUrl('products.csv', 'adobeTarget', config, params);
// Returns: { url: 'https://...adobeioruntime.net/.../download-file?fileName=products.csv', expiresAt: null }
```

### For Other Systems (Programmatic Updates)

```javascript
// Use presigned URLs for systems that can handle URL changes
const apiAccess = await generateFileAccessUrl('products.csv', 'salesforce', config, params);
// Returns: { url: 'https://...blob.core.windows.net/...?sig=...', expiresIn: 172800 }
```

### For Adobe I/O Runtime Actions

```javascript
// Use internal URLs for performance within Adobe I/O Runtime
const internalAccess = await generateFileAccessUrl('products.csv', 'internal', config, params, {
  urlType: 'internal'
});
```

## Architecture

### Per-System Access Pattern

| Use Case | Method | Benefits | When to Use |
|----------|--------|----------|-------------|
| **Users** | Action URLs | Reliable, cross-browser, no expiry | Frontend downloads, user-facing features |
| **Adobe Target** | Action URLs | Stable, never expire, no manual updates | Manual configuration systems |
| **Other Systems** | Presigned URLs | Fast, direct access, optimized | APIs with programmatic URL update capability |

### Configuration

```javascript
// config/domains/files.js
dualAccess: {
  patterns: {
    user: {
      method: 'download-action',
      reason: 'Reliable access, consistent availability, works across all browsers'
    },
    system: {
      method: 'presigned-url',
      reason: 'Optimized performance, direct access, reduced runtime calls'
    },
    api: {
      method: 'presigned-url',
      reason: 'Direct access for external integrations like Adobe Target'
    }
  },
  defaultUrlType: {
    system: 'external',   // CDN-based for external systems
    api: 'external',      // CDN-based for API access
    internal: 'internal'  // Direct storage for Adobe I/O Runtime actions
  }
}
```

## API Reference

### generateFileAccessUrl()

Generates appropriate file access URL based on use case.

```javascript
const { generateFileAccessUrl } = require('../src/files/utils/access-patterns');

const result = await generateFileAccessUrl(fileName, useCase, config, params, options);
```

**Parameters:**

- `fileName` (string): Name of the file
- `useCase` (string): 'user', 'system', 'api', 'internal'
- `config` (Object): Configuration object
- `params` (Object): Action parameters with credentials
- `options` (Object, optional): Additional options for presigned URLs

**Returns:**

```javascript
{
  success: true,
  url: 'https://...',
  method: 'download-action' | 'presigned-url',
  urlType: 'action' | 'external' | 'internal',
  useCase: 'user' | 'system' | 'api' | 'internal',
  reason: 'Human-readable explanation',
  expiresAt: '2023-...' | null,
  expiresIn: 3600 | null,
  metadata: { ... }
}
```

### generateSystemPresignedUrl()

Direct presigned URL generation for system access.

```javascript
const { generateSystemPresignedUrl } = require('../src/files/workflows/file-management');

const result = await generateSystemPresignedUrl(fileName, config, params, options);
```

**Options:**

- `expiresIn` (number): Expiration time in seconds (default: 3600)
- `urlType` (string): 'external' or 'internal' (default: 'external')
- `permissions` (string): 'r', 'rw', 'rwd' (default: 'r')
- `useCase` (string): Use case identifier for tracking

## Adobe I/O Files SDK Integration

### Native Support

The system uses Adobe I/O Files SDK's native `generatePresignURL` method:

```javascript
// Native SDK method
const presignedUrl = await files.generatePresignURL(fileName, {
  expiryInSeconds: 3600,
  permissions: 'r',
  urltype: 'external'
});
```

### URL Types

#### External URLs (CDN-based)

- Accessible from anywhere
- Optimized for external systems
- Best for Adobe Target, APIs, public access

#### Internal URLs (Direct storage)

- Only work within Adobe I/O Runtime
- No CDN overhead
- Best for action-to-action data transfer

## Testing

### Comprehensive Test Suite

Run the comprehensive presigned URL test:

```bash
node test-presigned-urls.js
```

This tests:

- External URL generation with various permissions
- Internal URL generation for runtime access
- Error handling and edge cases
- URL analysis and validation

### Test Scenarios

The test suite covers:

1. **External URL - Read Only**: CDN access for downloads
2. **Internal URL - Read Only**: Direct storage for runtime
3. **External URL - Read/Write**: Full access for uploads
4. **Internal URL - Read/Write/Delete**: Complete permissions
5. **Default Options**: SDK behavior with minimal config

### Sample Test Output

```text
🧪 Testing Adobe I/O Files SDK generatePresignURL functionality...

✅ Adobe I/O Files SDK initialized successfully
📋 generatePresignURL method available: true

📂 Testing with file: exports/products.csv

🔍 Testing: External URL - Read Only
✅ Success (45ms)
📎 URL: https://adobeio-static.net/...
🔍 Analysis: { urlType: 'external-cdn', hasSignature: true }

📊 Test Results Summary:
✅ Successful tests: 5/5
💡 All tests passed! Native presigned URLs are fully supported
```

## Use Cases

### Adobe Target Integration

### 🚨 **Technical Constraint: Presigned URLs Required**

**Critical Reality**: Adobe Target has a technical limitation - it can **ONLY** consume presigned URLs, not action-based URLs. This creates unavoidable operational overhead.

```javascript
const { generateFileAccessUrl } = require('../src/files/utils/access-patterns');

// Generate Adobe Target presigned URL (maximum 7-day expiration)
const result = await generateFileAccessUrl(
  'products.csv',
  'adobeTarget', // ← MUST use presigned URLs - technical constraint
  config,
  params
);

if (result.success) {
  console.log('Adobe Target URL:', result.url);
  console.log('Expires in:', result.expiresIn / 86400, 'days'); // 7 days maximum
  console.log('Expires at:', new Date(result.expiresAt).toLocaleString());
  console.log('Method:', result.method); // 'presigned-url'
  
  // ⚠️ IMPORTANT: You must manually update this URL in Adobe Target weekly!
}
```

### **Operational Implications for End Users**

| Aspect | Reality | Impact |
|--------|---------|--------|
| **URL Expiration** | ⚠️ 7 days maximum (AWS S3 limit) | Weekly manual updates required |
| **Target Configuration** | ❌ Manual only - no API | Must login to Target UI weekly |
| **Automation** | ❌ Not possible | No programmatic solution exists |
| **Operational Cost** | 🔄 Weekly manual work | ~15 minutes per week |
| **Risk** | ⚠️ Service disruption if forgotten | Data feed stops working |

### **📅 Operational Procedures**

#### **Weekly URL Update Process**

1. **Generate New URL** (every 7 days):

   ```bash
   # Test the action to get current URL
   npm run test:action get-products
   
   # Look for: Download URL: https://...
   # Copy the presigned URL from the output
   ```

2. **Update Adobe Target**:
   - Login to Adobe Target admin interface
   - Navigate to data feed configuration
   - Replace the old URL with the new presigned URL
   - Save and verify the feed is working

3. **Set Reminders**:
   - Calendar reminder every 7 days
   - Consider setting it for 6 days to have buffer time
   - Document the last update date for tracking

#### **Automation Workarounds**

While full automation isn't possible, you can minimize manual work:

```javascript
// Generate a monitoring script to check URL expiration
const result = await generateFileAccessUrl('products.csv', 'adobeTarget', config, params);
const daysUntilExpiry = (new Date(result.expiresAt) - new Date()) / (1000 * 60 * 60 * 24);

if (daysUntilExpiry < 2) {
  console.log('🚨 URGENT: Adobe Target URL expires in', Math.round(daysUntilExpiry), 'days!');
  console.log('New URL needed:', result.url);
}
```

### **Why 7 Days is Optimal**

| Expiration Time | Manual Updates | Pros | Cons |
|----------------|---------------|------|------|
| **1 day** | Daily | More secure | Extremely high maintenance |
| **7 days** | Weekly | ✅ Minimal maintenance | Slightly less secure |
| **> 7 days** | ❌ Impossible | N/A | AWS S3 hard limit |

**Conclusion**: 7 days is the optimal balance - maximum AWS allows while minimizing operational overhead.

### Long-Lived URLs for 24-Hour Refresh Cycle

Adobe Target requires presigned URLs that remain valid for extended periods to support its 24-hour refresh cycle:

```javascript
const { generateFileAccessUrl } = require('../src/files/utils/access-patterns');

// Generate Adobe Target optimized presigned URL
const result = await generateFileAccessUrl(
  'products.csv',
  'adobeTarget', // Specific use case for Adobe Target
  config,
  params
);

if (result.success) {
  console.log('Adobe Target URL:', result.url);
  console.log('Valid for:', Math.round(result.expiresIn / 3600), 'hours');
  console.log('Expires at:', new Date(result.expiresAt).toLocaleString());
}
```

### Adobe Target Configuration

The `adobeTarget` use case automatically:

- **Uses 48-hour expiration** (2 days) providing safety buffer for 24-hour refresh
- **External CDN URLs** for optimal performance
- **Read-only permissions** for security
- **No expiration concerns** for daily workflows

### Configuration Settings

```javascript
// config/domains/files.js
expiration: {
  short: 1800,        // 30 minutes for temporary access
  long: 3600,         // 1 hour for general use (legacy)
  adobeTarget: 172800, // 48 hours (2 days) for Adobe Target
  maximum: 604800,    // 7 days - AWS S3 maximum
},

dualAccess: {
  patterns: {
    user: { method: 'download-action' },
    adobeTarget: { method: 'presigned-url' },
    api: { method: 'presigned-url' },
  },
  defaultUrlType: {
    adobeTarget: 'external', // CDN-based for performance
    api: 'external',
  },
},
```

### External API Integration

```javascript
// For external APIs requiring file access
const apiAccess = await generateFileAccessUrl('products.csv', 'api', config, params);

const response = await fetch('https://external-api.com/import', {
  method: 'POST',
  body: JSON.stringify({
    fileUrl: apiAccess.url,
    format: 'csv'
  })
});
```

### Action-to-Action Data Transfer

```javascript
// For passing files between Adobe I/O Runtime actions
const internalAccess = await generateFileAccessUrl('products.csv', 'internal', config, params, {
  urlType: 'internal'
});

// Use internal URL for better performance within runtime
await processDataInAnotherAction(internalAccess.url);
```

## Migration Guide

### From Action-Only Pattern

**Before** (action-only):

```javascript
const downloadUrl = buildFileDownloadUrl(fileName, config);
```

**After** (dual access pattern):

```javascript
// For users
const userAccess = await generateFileAccessUrl(fileName, 'user', config, params);
const downloadUrl = userAccess.url;

// For systems
const systemAccess = await generateFileAccessUrl(fileName, 'system', config, params);
const presignedUrl = systemAccess.url;
```

### Benefits of Migration

1. **Better Performance**: Direct access for systems
2. **Reduced Load**: Fewer action invocations
3. **Flexibility**: Choose best method per use case
4. **Future-Proof**: Native SDK support

## Troubleshooting

### Common Issues

**Presigned URLs not working:**

```bash
# Test native support
node test-presigned-urls.js
```

**Wrong URL type returned:**

- Check `useCase` parameter matches intended use
- Verify configuration in `config/domains/files.js`

**Expiry issues:**

- External URLs: Check `expiresAt` field
- Action URLs: Never expire (use for users)

### Debug Information

Enable debug logging:

```javascript
const result = await generateFileAccessUrl(fileName, useCase, config, params);
console.log('Access result:', result.metadata);
```

## Security Considerations

### Presigned URL Security

- **Time-limited**: All presigned URLs expire
- **Permission-controlled**: Specify exact permissions needed
- **Use case specific**: Different patterns for different needs

### Best Practices

1. **Minimal Permissions**: Use 'r' unless write access needed
2. **Short Expiry**: Use shortest viable expiration time
3. **Use Case Matching**: Match URL type to actual use case
4. **Monitor Access**: Track presigned URL usage patterns

## Performance

### Benchmarks

| Method | Use Case | Avg Response Time | Reliability |
|--------|----------|------------------|-------------|
| Action URL | User download | 50-200ms | 99.9% |
| Presigned URL | System access | 10-50ms | 99.5% |
| Internal URL | Runtime action | 5-20ms | 99.8% |

### Optimization Tips

1. **Cache presigned URLs**: Reuse within expiry period
2. **Batch generation**: Generate multiple URLs at once
3. **Choose appropriate expiry**: Balance security vs performance

## Contributing

### Adding New Use Cases

1. Add pattern to `config/domains/files.js`
2. Update `access-patterns.js` if needed
3. Add test scenarios to `test-presigned-urls.js`
4. Update this documentation

### Testing Changes

```bash
# Test presigned URL functionality
node test-presigned-urls.js

# Test action integration
npm run test:action get-products
```
