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
    batching: {
      requestDelay: 75, // Delay between batches in ms
      maxConcurrent: 15, // Max concurrent requests
      inventoryBatchSize: 50, // SKUs per inventory batch
      categoryBatchSize: 20, // Categories per batch
    },

    caching: {
      fileListTimeout: 300, // 5 minutes (file browser)
    },
  };
}

module.exports = {
  buildPerformanceConfig,
};
