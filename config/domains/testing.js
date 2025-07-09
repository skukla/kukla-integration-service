/**
 * Testing Domain Configuration
 * @module config/domains/testing
 *
 * 🎯 Used by: Test execution, API testing, performance testing, action testing
 * ⚙️ Key settings: Test environments, endpoints, thresholds, technical testing configuration
 *
 * 📋 Shared settings: Uses main configuration for expected product counts
 */

/**
 * Build testing configuration
 * @param {Object} [params] - Action parameters (unused - kept for interface consistency)
 * @param {Object} [mainConfig] - Shared main configuration
 * @returns {Object} Testing configuration
 */
function buildTestingConfig(params = {}, mainConfig = {}) {
  // Note: params parameter kept for consistent interface but not used
  // eslint-disable-next-line no-unused-vars
  params;

  return {
    endpoints: {
      products: '/api/v1/web/kukla-integration-service-default/get-products',
      'products-mesh': '/api/v1/web/kukla-integration-service-default/get-products-mesh',
      files: '/api/v1/web/kukla-integration-service-default/browse-files',
    },

    expectations: {
      maxExecutionTime: 5000, // Technical: expected max execution time for tests

      // 🔗 SHARED: Expected values from main configuration
      expectedProductCount: mainConfig.expectedProductCount || 119, // Shared from main

      baseline: {
        maxAgeDays: 30, // Technical: max age for baseline comparisons
      },
      thresholds: {
        responseTime: {
          p95: 2000, // Technical: 95th percentile response time
          p99: 5000, // Technical: 99th percentile response time
        },
        errorRate: 0.05, // Technical: max error rate (5%)
      },
    },

    scenarios: {
      batching: {
        smallBatch: { pageSize: 100, expectedTime: 3500 }, // Technical: test scenarios
        optimal: { pageSize: 150, expectedTime: 2500 },
        large: { pageSize: 200, expectedTime: 3000 },
        extraLarge: { pageSize: 300, expectedTime: 4000 },
      },
    },

    options: {
      defaultEnvironment: 'local', // Technical: default test environment
      defaultIterations: 1, // Technical: default test iterations
      environment: 'local',
      iterations: 1,
    },
  };
}

module.exports = {
  buildTestingConfig,
};
