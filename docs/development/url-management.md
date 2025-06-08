# URL Management

> **Consistent URL building across backend and frontend contexts**

## Overview

The URL management system provides a consistent way to build URLs across both backend and frontend code, handling the differences between Adobe I/O Runtime environments and HTMX requirements transparently.

## Architecture

### Core Components

1. **`src/core/url/index.js`** - Backend URL management with configuration loading
2. **`web-src/src/js/core/url.js`** - **Auto-generated** frontend URL management
3. **`src/core/routing/index.js`** - Re-exports for backward compatibility
4. **`scripts/generate-frontend.js`** - Generates frontend URL module from backend patterns

### Key Features

- **Consistent Algorithm**: Same URL building logic across all contexts
- **Auto-Generated Frontend**: Frontend URL module generated from backend patterns
- **Environment Awareness**: Automatic detection of staging vs production patterns
- **HTMX Compatibility**: Handles relative URLs for static hosting scenarios
- **Parameter Handling**: Consistent URL parameter encoding across contexts
- **No Code Duplication**: Frontend functions generated from backend logic

## Frontend Generation

The frontend URL module is automatically generated during build to ensure consistency:

```bash
npm run build:config    # Generates both config and URL modules
npm run start          # Auto-generates during deployment
npm run deploy         # Auto-generates during deployment
```

### Generation Process

1. **Source**: Extracts URL building logic from `src/core/url/index.js`
2. **Transform**: Converts backend patterns to frontend-compatible ES6 modules
3. **Output**: Creates `web-src/src/js/core/url.js` with equivalent functions
4. **Consistency**: Ensures frontend URL building matches backend exactly

### Generated Functions

The frontend module includes auto-generated equivalents of backend functions:

```javascript
// Auto-generated from backend buildRuntimeUrl
export function getActionUrl(action, params) {
  /* ... */
}

// Auto-generated from backend file URL patterns
export function getDownloadUrl(fileName, path) {
  /* ... */
}

// Auto-generated configuration access
export function getConfig() {
  /* ... */
}
```

## Usage Patterns

### Backend Usage

```javascript
// Import the backend adapter
const { buildRuntimeUrl, urlManager } = require('../../src/core/routing');

// Build action URLs (existing API - no changes needed)
const actionUrl = buildRuntimeUrl('get-products', null, params);

// Or use the new URL manager for advanced features
const downloadUrl = urlManager.buildActionUrl('download-file', {
  params: { fileName: 'products.csv' },
  absolute: true,
});

// Commerce URLs (unchanged)
const commerceUrl = buildCommerceUrl(baseUrl, '/products', { id: 123 });
```

### Frontend Usage

```javascript
// Import the frontend utilities
import { getActionUrl, getDownloadUrl } from '../core/url.js';

// Build action URLs
const browseUrl = getActionUrl('browse-files');
const downloadUrl = getDownloadUrl('products.csv', '/exports/');

// Advanced usage with buildActionUrl
import { buildActionUrl } from '../core/url.js';

const customUrl = buildActionUrl(urlConfig, 'custom-action', {
  absolute: false, // Force relative URL
  params: { filter: 'active' },
});
```

### HTMX Integration

The system automatically handles HTMX-specific requirements:

```html
<!-- Relative URLs for static hosting -->
<div
  hx-get="/api/v1/web/kukla-integration-service/browse-files"
  hx-trigger="load"
  hx-target="#file-list"
></div>

<!-- Absolute URLs when needed -->
<button
  hx-get="https://adobeioruntime.net/api/v1/web/285361-188maroonwallaby-stage/kukla-integration-service/download-file?fileName=products.csv"
  hx-trigger="click"
>
  Download
</button>
```

## Configuration

### Environment Detection

The system automatically detects the environment and applies appropriate URL patterns:

#### Staging Environment

- **Base URL**: `https://adobeioruntime.net`
- **Namespace**: `285361-188maroonwallaby-stage`
- **Pattern**: `baseUrl/api/v1/web/namespace/package/action`

#### Production Environment

- **Base URL**: `https://adobeioruntime.net`
- **Namespace**: `285361-188maroonwallaby`
- **Pattern**: `baseUrl/api/v1/web/namespace/package/action`

#### Static Hosting (Frontend)

- **Base URL**: `""` (empty for relative URLs)
- **Pattern**: `/api/v1/web/package/action` (no namespace in path)

### URL Building Options

```javascript
const options = {
  // Whether to build absolute or relative URLs
  absolute: true, // default: true for backend, auto-detected for frontend

  // URL parameters to append
  params: {
    fileName: 'products.csv',
    filter: 'active',
  },

  // Override namespace inclusion (rarely needed)
  includeNamespace: null, // default: auto-detect based on baseUrl
};
```

## Module Organization

The system uses consistent module structure and function names:

### Backend: `src/core/url/index.js`

```javascript
const { buildRuntimeUrl, buildCommerceUrl } = require('../../src/core/routing');

// Runtime URLs
const url = buildRuntimeUrl('get-products', null, params);

// Commerce URLs
const commerceUrl = buildCommerceUrl('products', { id: 123 });
```

### Frontend: `web-src/src/js/core/url.js`

```javascript
import { getActionUrl, getDownloadUrl, buildDownloadUrl } from '../core/url.js';

// Simple action URLs
const url = getActionUrl('browse-files');

// File URLs
const downloadUrl = getDownloadUrl('products.csv', '/exports/');
```

## Implementation Details

### Namespace Handling

The system automatically determines whether to include the namespace in the URL path:

- **Include namespace**: When `baseUrl` contains `adobeioruntime.net`
- **Exclude namespace**: When `baseUrl` is empty or contains `adobeio-static.net`

### Parameter Encoding

URL parameters are consistently encoded using `URLSearchParams`:

```javascript
// Input
{ fileName: 'products & inventory.csv', filter: 'active' }

// Output
'?fileName=products%20%26%20inventory.csv&filter=active'
```

### Error Handling

The system provides clear error messages for common issues:

```javascript
// Unknown action
getActionUrl('unknown-action'); // throws: "Unknown action: unknown-action"

// Missing configuration
buildCommerceUrl('', '/products'); // throws: "Commerce base URL is required"
```

## Testing

### Backend Testing

```javascript
// Test with custom base URL
const testUrl = buildRuntimeUrl('get-products', 'http://localhost:3000', params);

// Test URL building
const { buildActionUrl } = require('../../src/core/url');
const config = loadConfig(params);
const url = buildActionUrl(config, 'get-products', { absolute: true });
console.log('Test URL:', url);
```

### Frontend Testing

```javascript
// Test URL building
import { getActionUrl, getConfig } from '../core/url.js';

const config = getConfig();
console.log('Frontend config:', config);

const testUrl = getActionUrl('browse-files', { test: true });
console.log('Test URL:', testUrl);
```

## Troubleshooting

### Common Issues

1. **Wrong URL Pattern**

   - Check environment configuration
   - Verify namespace settings
   - Ensure baseUrl is correct

2. **CORS Issues**

   - Verify CORS headers in responses
   - Check if using correct relative/absolute URLs
   - Ensure static hosting configuration is correct

3. **Parameter Encoding**
   - Use the built-in parameter handling
   - Don't manually encode parameters
   - Check for special characters in parameter values

### Debug Information

```javascript
// Backend debugging
const { loadConfig } = require('../../config');
console.log('Backend config:', loadConfig(params));

// Frontend debugging
import { getConfig } from '../core/url.js';
console.log('Frontend config:', getConfig());
```

## Related Documentation

- **[Configuration Guide](configuration.md)** - Environment and runtime configuration
- **[HTMX Integration](../architecture/htmx-integration.md)** - HTMX-specific patterns
- **[Adobe App Builder Architecture](../architecture/adobe-app-builder.md)** - Platform overview
- **[Testing Guide](testing.md)** - Testing URL building and routing

---

_This URL management system provides a consistent, maintainable approach to URL handling across the entire Adobe App Builder application._
