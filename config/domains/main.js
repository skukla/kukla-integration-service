/**
 * Main Configuration Domain
 * @module config/domains/main
 *
 * 🎯 SHARED CORE CONFIGURATION - Business logic defaults
 *
 * Contains commonly changed business settings with clean defaults.
 * Environment-specific settings come from .env file.
 *
 * ⚙️ Business settings: Product counts, timeouts, batch sizes, defaults
 */

/**
 * Build main shared configuration
 * @returns {Object} Main configuration
 */
function buildMainConfig() {
  return {
    // 📊 BUSINESS SETTINGS
    expectedProductCount: 119, // Expected catalog size (affects testing, baselines)
    csvFilename: 'products.csv', // Default export filename
    exportFields: ['sku', 'name', 'price', 'qty', 'categories', 'images'],

    // 📁 STORAGE SETTINGS
    storage: {
      provider: 's3', // Storage provider: 's3' or 'app-builder'
    },

    // ⚡ PERFORMANCE SETTINGS (business logic defaults)
    timeouts: {
      commerceApi: 30000, // Commerce API timeout (30s)
      meshApi: 30000, // Mesh GraphQL timeout (30s)
      actionExecution: 30000, // Action execution timeout (30s)
    },
    batching: {
      productPageSize: 100, // Products per page from Commerce API
      maxPages: 25, // Maximum pages to process
      inventoryBatchSize: 50, // SKUs per inventory batch
      categoryBatchSize: 20, // Categories per batch
      maxConcurrent: 15, // Max concurrent requests
    },
    memory: {
      maxUsage: 50000000, // 50MB memory limit
    },
    retries: {
      attempts: 3, // Retry attempts for failed requests
      delay: 1000, // Delay between retries (ms)
    },

    // ⏰ CACHE SETTINGS (business logic defaults)
    cache: {
      categoriesTtl: 300000, // 5 minutes (mesh operations)
      categoriesFileTimeout: 1800, // 30 minutes (file operations)
      fileListTimeout: 300, // 5 minutes (file browser)
    },
  };
}

module.exports = {
  buildMainConfig,
};
