# Configuration Management

This document explains how to configure the Adobe App Builder Commerce integration.

## 🎯 Configuration Philosophy

**Simple, clean separation of concerns:**

- **`.env`** - Environment-specific URLs and sensitive credentials only
- **`config/domains/main.js`** - Shared business settings only (minimal)
- **Other config domains** - Self-contained technical settings

## 🔧 Environment Configuration (.env)

Keep .env **minimal and focused** on what actually varies between environments:

```bash
# .env - Only environment-specific URLs and sensitive credentials
# === ENVIRONMENT-SPECIFIC ===
COMMERCE_BASE_URL=https://your-store.com
API_MESH_ENDPOINT=https://your-mesh-endpoint.com
RUNTIME_URL=https://your-runtime.adobeioruntime.net

# === SENSITIVE CREDENTIALS ===
COMMERCE_CONSUMER_KEY=your-key
COMMERCE_CONSUMER_SECRET=your-secret
COMMERCE_ACCESS_TOKEN=your-token
COMMERCE_ACCESS_TOKEN_SECRET=your-token-secret
MESH_API_KEY=your-mesh-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

## 🎯 Main Configuration (Shared Business Settings)

Main configuration contains **only truly shared business settings**:

```javascript
// config/domains/main.js - Only shared business settings
{
  // 📊 BUSINESS SETTINGS (truly shared across domains)
  expectedProductCount: 119,        // Used by testing domain
  csvFilename: 'products.csv',      // Used by files domain
  exportFields: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
  
  // 🏗️ BUSINESS DEPLOYMENT CHOICE
  storage: {
    provider: 's3',                 // Storage provider choice
  },
}
```

## 🔗 Domain Configuration

**Each domain handles its own settings independently** - no complex sharing:

### Performance Domain (Self-Contained)

```javascript
// config/domains/performance.js - All performance settings in one place
{
  timeouts: {
    api: { commerce: 30000, mesh: 30000 },
    runtime: { action: 30000, cli: 5000 },
  },
  memory: { maxUsage: 50000000 },
  retries: { attempts: 3, delay: 1000 },
  batching: { 
    productPageSize: 100, 
    maxPages: 25,
    maxConcurrent: 15 
  },
  caching: { 
    categories: { meshTtl: 300000, fileTimeout: 1800 },
    fileListTimeout: 300 
  },
}
```

### Products Domain (Self-Contained)

```javascript
// config/domains/products.js - All product settings in one place
{
  pagination: { pageSize: 100, maxPages: 25 },
  batching: { size: 50 },
  fields: { export: [...], processing: [...] },
}
```

### Simple Sharing Pattern

Only **2 domains** reference main configuration for truly shared business settings:

```javascript
// ✅ Files domain: References main for CSV filename (business setting)
filename: mainConfig.csvFilename || 'products.csv'

// ✅ Testing domain: References main for expected count (business setting)  
expectedProductCount: mainConfig.expectedProductCount || 119
```

All other domains are **completely self-contained**.

## 🏗️ Making Configuration Changes

### Business Settings

```javascript
// Edit config/domains/main.js:
expectedProductCount: 150,        // Update expected catalog size
csvFilename: 'my-products.csv',   // Change export filename
exportFields: ['sku', 'name'],    // Customize export fields
storage: { provider: 'app-builder' }, // Switch storage
```

### Technical Settings

```javascript
// Edit specific domains directly:
// config/domains/performance.js
timeouts: { api: { commerce: 45000 } }  // Increase Commerce timeout

// config/domains/products.js  
pagination: { pageSize: 150 }           // Increase page size
```

### Environment Settings

```bash
# Edit .env file:
COMMERCE_BASE_URL=https://new-store.com
AWS_ACCESS_KEY_ID=new-key
```

## 📁 Configuration Structure

```text
config/
├── index.js                 # Configuration loader
├── domains/                 # Domain-specific configuration
│   ├── main.js              # 🎯 SHARED BUSINESS (minimal)
│   ├── commerce.js          # Self-contained Commerce settings
│   ├── products.js          # Self-contained product settings
│   ├── performance.js       # Self-contained performance settings
│   ├── mesh.js              # Self-contained mesh settings
│   ├── files.js             # Self-contained file settings (+ CSV filename from main)
│   ├── runtime.js           # Self-contained runtime settings
│   ├── testing.js           # Self-contained test settings (+ expected count from main)
│   └── ui.js                # Self-contained UI settings
└── environments/            # Environment overrides (if needed)
```

## 🧪 Testing Configuration

Test your configuration changes:

```bash
# Test with new configuration:
npm run test:action get-products
npm run test:action get-products-mesh

# Performance testing:
npm run test:perf:compare
```

## 🎯 Best Practices

1. **Keep main minimal** - Only truly shared business settings
2. **Self-contained domains** - Each domain handles its own technical settings
3. **No over-sharing** - Don't share settings unless absolutely necessary
4. **Keep .env minimal** - Only environment URLs and credentials
5. **Test after changes** - Verify actions work after configuration changes

## ❗ Important Notes

### Configuration Access Patterns

```javascript
// ✅ MAIN: Only for truly shared business settings
config.main.expectedProductCount
config.main.csvFilename
config.main.exportFields
config.main.storage.provider

// ✅ DOMAINS: Self-contained technical settings
config.performance.timeouts.api.commerce
config.products.pagination.pageSize
config.files.processing.fileListTimeout
```

### Simplified Sharing

```javascript
// ✅ CORRECT: Minimal sharing for business settings only
function buildFilesConfig(params, mainConfig) {
  return {
    storage: {
      csv: {
        filename: mainConfig.csvFilename || 'products.csv',  // Shared business setting
        chunkSize: 8192,                                    // Domain-specific technical setting
      },
    },
  };
}

// ❌ AVOID: Complex sharing of technical settings
function buildDomainConfig(params, mainConfig) {
  return {
    timeout: mainConfig.performance?.timeout || 30000,      // Over-engineering
    caching: mainConfig.performance?.caching || defaults,   // Unnecessary complexity
  };
}
```

This approach keeps configuration **simple, predictable, and maintainable** with minimal sharing and maximum domain independence.
