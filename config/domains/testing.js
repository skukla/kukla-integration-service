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
 * @param {Object} [params] - Action parameters (unused)
 * @param {Object} [mainConfig] - Shared main configuration (for expected product count only)
 * @returns {Object} Testing configuration
 */
function buildTestingConfig(params = {}, mainConfig = {}) {
  // eslint-disable-next-line no-unused-vars
  params; // Keep for interface consistency

  return {
    endpoints: {
      products: '/api/v1/web/kukla-integration-service-default/get-products',
      'products-mesh': '/api/v1/web/kukla-integration-service-default/get-products-mesh',
      files: '/api/v1/web/kukla-integration-service-default/browse-files',
    },

    expectations: {
      maxExecutionTime: 5000, // Technical setting
      expectedProductCount: mainConfig.expectedProductCount || 119, // Shared from main (business setting)

      baseline: {
        maxAgeDays: 30, // Technical setting
      },
      thresholds: {
        responseTime: {
          p95: 2000, // Technical setting
          p99: 5000, // Technical setting
        },
        errorRate: 0.05, // Technical setting
      },
    },

    scenarios: {
      batching: {
        smallBatch: { pageSize: 100, expectedTime: 3500 }, // Technical settings
        optimal: { pageSize: 150, expectedTime: 2500 },
        large: { pageSize: 200, expectedTime: 3000 },
        extraLarge: { pageSize: 300, expectedTime: 4000 },
      },
    },

    options: {
      defaultEnvironment: 'local', // Technical setting
      defaultIterations: 1, // Technical setting
      environment: 'local',
      iterations: 1,
    },
  };
}

module.exports = {
  buildTestingConfig,
};
