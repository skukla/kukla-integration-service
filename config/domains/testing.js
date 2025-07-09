/**
 * Testing Domain Configuration
 * @module config/domains/testing
 *
 * 🎯 Used by: Test execution, API testing, performance testing, action testing
 * ⚙️ Key settings: Test environments, endpoints, timeouts, thresholds
 */

/**
 * Build testing configuration
 * @returns {Object} Testing configuration
 */
function buildTestingConfig() {
  return {
    api: {
      retries: 3,
    },
    endpoints: {
      products: '/api/v1/web/kukla-integration-service-default/get-products',
      'products-mesh': '/api/v1/web/kukla-integration-service-default/get-products-mesh',
      files: '/api/v1/web/kukla-integration-service-default/browse-files',
    },
    expectations: {
      maxExecutionTime: 5000, // Expected max execution time for tests
      expectedProducts: 119, // Expected product count for validation
      baseline: {
        maxAgeDays: 30, // max age for baseline comparisons
      },
      thresholds: {
        responseTime: {
          p95: 2000, // 95th percentile response time
          p99: 5000, // 99th percentile response time
        },
        errorRate: 0.05, // max error rate (5%)
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
    options: {
      defaultEnvironment: 'local',
      defaultIterations: 1,
      outputFormats: ['json', 'raw'],
      environment: 'local', // test environment
      iterations: 1, // test iterations
    },
  };
}

module.exports = {
  buildTestingConfig,
};
