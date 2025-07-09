# Storage Strategy Pattern

> **Selective Strategy Pattern implementation for storage providers only**

## Overview

We've implemented the Strategy pattern **only for storage providers** because:

- ✅ **Real benefit**: Likely to add Azure, GCP, local filesystem
- ✅ **Reduces complexity**: Eliminates switch statement maintenance  
- ✅ **Easy extension**: Add new providers without modifying existing code

## Implementation

### Before: Switch Statement (40 lines)

```javascript
async function initializeStorage(config, params = {}) {
  const provider = config.storage.provider;
  switch (provider) {
    case 'app-builder':
      try {
        return await initializeAppBuilderStorage(config, params);
      } catch (error) {
        throw new Error(`Adobe I/O Files storage initialization failed: ${error.message}`);
      }
    case 's3':
      try {
        return await initializeS3Storage(config, params);
      } catch (error) {
        throw new Error(`S3 storage initialization failed: ${error.message}`);
      }
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}
```

### After: Strategy Pattern (5 lines)

```javascript
async function initializeStorage(config, params = {}) {
  const provider = config.storage.provider;
  return await selectStorageStrategy(provider, config, params);
}
```

## Adding New Storage Providers

### Example: Adding Azure Storage

```javascript
// 1. Create Azure strategy function
async function azureStorageStrategy(config, params) {
  const azureClient = createAzureClient(config, params);
  return createAzureStorageWrapper(azureClient, config);
}

// 2. Add to strategy registry (one line!)
const STORAGE_STRATEGIES = {
  'app-builder': appBuilderStorageStrategy,
  's3': s3StorageStrategy,
  'azure': azureStorageStrategy, // ← Just add this line
};
```

**That's it!** No switch statement modifications, no error handling duplication.

## Benefits Achieved

1. **✅ Cleaner code**: 40 lines → 5 lines
2. **✅ Easy extension**: One line to add new providers
3. **✅ Better testing**: Test each strategy independently
4. **✅ Consistent interface**: All providers work the same way
5. **✅ No over-engineering**: Only applied where it provides clear value

## Usage

```javascript
// Works exactly the same as before
const storage = await files.initializeStorage(config, params);

// Or use strategy directly
const storage = await files.strategies.storage.selectStorageStrategy('s3', config, params);
```

## Future Storage Providers

Easy to add:

- **Azure Blob Storage**
- **Google Cloud Storage**  
- **Local filesystem** (for development)
- **FTP/SFTP**
- **Custom storage APIs**

Each requires only adding one function to the strategy registry.
