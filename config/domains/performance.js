/**
 * Performance Domain Configuration
 * @module config/domains/performance
 *
 * 🎯 Used by: All actions for monitoring and optimization
 * ⚙️ Key settings: Execution limits, tracing, performance monitoring, batching, caching, timeouts
 */

/**
 * Build performance configuration
 * @returns {Object} Performance configuration
 */
function buildPerformanceConfig() {
  return {
    maxExecutionTime: 30000,
    timeouts: {
      // API timeouts
      api: {
        commerce: 30000, // Commerce API timeout
        mesh: 30000, // Mesh GraphQL timeout
        testing: 10000, // Testing API timeout
      },
      // Runtime timeouts
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
    batching: {
      requestDelay: 75, // delay between batches in ms
      maxConcurrent: 15, // max concurrent requests
      bulkInventoryThreshold: 25, // SKUs per bulk request
    },
    caching: {
      categories: {
        meshTtl: 300000, // 5 minutes in ms (for mesh operations)
        fileTimeout: 1800, // 30 minutes (for file operations)
      },
    },
    optimization: {
      parallelProcessing: true, // enable parallel processing
      preAllocateArrays: true, // performance optimization
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
