/**
 * Performance Domain Configuration
 * @module config/domains/performance
 *
 * 🎯 Used by: All actions for monitoring and optimization
 * ⚙️ Key settings: Execution limits, tracing, performance monitoring
 */

/**
 * Build testing performance configuration
 * @returns {Object} Testing performance settings
 */
function buildTestingConfig() {
  return {
    thresholds: {
      executionTime: 5000,
      maxMemory: 50000000,
      products: 1000,
      responseTime: {
        p95: 2000,
        p99: 5000,
      },
    },
    scenarios: {
      restApi: {
        maxTime: 5000,
        expectedProducts: 119,
      },
      mesh: {
        maxTime: 5000,
        expectedProducts: 119,
      },
      batching: {
        smallBatch: { pageSize: 100, expectedTime: 3500 },
        optimal: { pageSize: 150, expectedTime: 2500 },
        large: { pageSize: 200, expectedTime: 3000 },
        extraLarge: { pageSize: 300, expectedTime: 4000 },
      },
    },
  };
}

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
    testing: buildTestingConfig(),
    tracing: {
      enabled: true,
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
