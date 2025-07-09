/**
 * Performance Domain Configuration
 * @module config/domains/performance
 *
 * 🎯 Used by: All actions for monitoring and optimization
 * ⚙️ Key settings: Execution limits, tracing, performance monitoring, batching, caching
 */

/**
 * Build performance configuration
 * @returns {Object} Performance configuration
 */
function buildPerformanceConfig() {
  return {
    maxExecutionTime: 30000,
    timeouts: {
      cli: 5000,
      action: 30000,
      mesh: 30000,
      testing: 10000, // Jest timeout
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
      categoryTtl: 300000, // 5 minutes in ms
      enableInMemoryCache: true,
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
