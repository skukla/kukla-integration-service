/**
 * Performance Domain Configuration
 * @module config/domains/performance
 *
 * Used by: All actions for monitoring and optimization
 * ⚙️ Key settings: Timeouts, memory limits, retries, batching, caching, monitoring
 */

/**
 * Build performance configuration
 * @returns {Object} Performance configuration
 */
function buildPerformanceConfig() {
  return {
    maxExecutionTime: 30000,

    timeouts: {
      api: {
        commerce: 30000, // Commerce API timeout
        mesh: 30000, // Mesh GraphQL timeout
        testing: 10000, // Testing API timeout
      },
      runtime: {
        cli: 5000, // CLI detection timeout
        action: 30000, // Action execution timeout
        testing: 10000, // Jest/testing timeout
      },
    },

    memory: {
      maxUsage: 50000000, // 50MB in bytes
      conversionUnit: 1024, // For byte conversions
    },

    retries: {
      attempts: 3, // Default retry attempts
      delay: 1000, // Default delay between retries in ms
      api: {
        commerce: { attempts: 3, delay: 1000 },
        mesh: { attempts: 3, delay: 1000 },
      },
    },

    batching: {
      requestDelay: 75, // Delay between batches in ms
      maxConcurrent: 15, // Max concurrent requests
      bulkInventoryThreshold: 25, // SKUs per bulk request
      productPageSize: 100, // Products per page from Commerce API
      maxPages: 25, // Maximum pages to process
      inventoryBatchSize: 50, // SKUs per inventory batch
      categoryBatchSize: 20, // Categories per batch
    },

    caching: {
      categories: {
        meshTtl: 300000, // 5 minutes (mesh operations)
        fileTimeout: 1800, // 30 minutes (file operations)
      },
      fileListTimeout: 300, // 5 minutes (file browser)
    },

    optimization: {
      parallelProcessing: true, // Enable parallel processing
      preAllocateArrays: true, // Performance optimization
    },

    tracing: {
      enabled: true,
      errorVerbosity: 'summary', // summary, detailed, minimal
      performance: {
        enabled: true,
        includeMemory: true,
        includeTimings: true,
      },
      timestampPrecision: 1000, // For timestamp calculations
    },
  };
}

module.exports = {
  buildPerformanceConfig,
};
