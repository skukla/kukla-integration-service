/**
 * Performance Domain Configuration
 * @module config/domains/performance
 */

/**
 * Build performance configuration
 * @returns {Object} Performance configuration
 */
function buildPerformanceConfig() {
  return {
    maxExecutionTime: 30000,
    tracing: {
      enabled: true,
      performance: {
        enabled: true,
        includeMemory: true,
        includeTimings: true,
      },
    },
  };
}

module.exports = {
  buildPerformanceConfig,
};
