/**
 * Performance Domain Configuration
 * @module config/domains/performance
 *
 * 🎯 Used by: All actions for monitoring and optimization
 * ⚙️ Key settings: Execution limits, tracing, performance monitoring
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
