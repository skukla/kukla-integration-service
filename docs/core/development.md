# Development Guide

[← Back to README](../README.md)

## Setup

### 1. Environment
```bash
# Copy environment template
cp .env.example .env

# Required variables:
COMMERCE_URL=<commerce-url>
COMMERCE_ADMIN_USERNAME=<username>
COMMERCE_ADMIN_PASSWORD=<password>
```

### 2. Adobe Developer Console
1. Create new project
2. Enable App Builder
3. Download configuration
4. Run `aio app use <config>`

### 3. Dependencies
```bash
npm install
```

## Development Workflow

### 1. Local Development
```bash
npm run dev          # Start development server
npm run build       # Build the application
npm run deploy      # Deploy to App Builder
```

### 2. Code Organization

```
actions/
├── core/           # Shared utilities
├── commerce/       # Commerce integration
├── htmx/          # HTMX responses
├── frontend/       # UI handlers
└── backend/        # Data processing

web-src/
└── src/
    └── js/
        ├── core/  # Frontend utilities
        ├── htmx/  # HTMX setup
        └── browser/ # UI components
```

### 3. Implementation Patterns

#### URL Handling
```javascript
// Frontend actions use getActionUrl
const url = getActionUrl('browse-files', { page: 1 });

// Commerce API calls use buildCommerceUrl
const url = buildCommerceUrl(baseUrl, '/V1/products');

// Base paths are configured in their respective modules
const URL_CONFIG = {
    BASE_PATH: '/api/v1/web/kukla-integration-service',
    ACTIONS: {
        'browse-files': '/browse-files',
        'delete-file': '/delete-file'
        // ... other actions
    }
};
```

#### Backend Actions
```javascript
// Example action structure
const { response } = require('../../core/http');
const { validateInput } = require('../../core/validation');

async function main(params) {
  // 1. Validate input
  const input = validateInput(params);
  
  // 2. Process request
  const result = await processRequest(input);
  
  // 3. Return response
  return response.success(result);
}
```

#### Frontend Components
```html
<!-- Example HTMX component -->
<div hx-get="/api/data"
     hx-trigger="load"
     hx-target="#content">
  <div id="content">
    <!-- Dynamic content -->
  </div>
</div>
```

### 4. Error Handling

```javascript
try {
  const result = await someOperation();
  return response.success(result);
} catch (error) {
  return response.error(error);
}
```

## Deployment

### 1. Build and Deploy
```bash
# Full deployment
npm run deploy

# Frontend only
npm run deploy:web

# Actions only
npm run deploy:actions
```

### 2. Verify Deployment
1. Check App Builder console
2. Verify endpoints
3. Test functionality
4. Monitor logs

## Best Practices

### 1. Code Style
- Follow ESLint config
- Use consistent patterns
- Keep functions focused
- Document complex logic

### 2. Error Handling
- Use core error utilities
- Include context
- Log appropriately
- Handle edge cases

### 3. Performance
- Use caching appropriately
- Optimize responses
- Monitor metrics
- Handle timeouts

For detailed guides, see:
- [Architecture](architecture.md)
- [API Reference](api-reference.md)
- [Error Handling](error-handling.md) 