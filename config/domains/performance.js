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
