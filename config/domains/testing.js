/**
 * Testing Domain Configuration
 * @module config/domains/testing
 *
 * 🎯 Used by: Test execution, API testing, performance testing, action testing
 * ⚙️ Key settings: Test environments, endpoints, timeouts, thresholds
 */

/**
 * Build testing configuration
 * @param {Object} params - Action parameters
 * @returns {Object} Testing configuration
 */
function buildTestingConfig(params = {}) {
  // Get required values with clear descriptive fallbacks
  const baseUrl = params.RUNTIME_URL || process.env.RUNTIME_URL || 'REQUIRED:RUNTIME_URL';

  return {
    api: {
      baseUrl,
      timeout: 10000,
      retries: 3,
    },
    endpoints: {
      products: '/api/v1/web/kukla-integration-service-default/get-products',
      'products-mesh': '/api/v1/web/kukla-integration-service-default/get-products-mesh',
      files: '/api/v1/web/kukla-integration-service-default/browse-files',
    },
    performance: {
      maxExecutionTime: 5000,
      expectedProducts: 119,
      baseline: {
        maxAgeDays: 30, // max age for baseline comparisons
      },
      thresholds: {
        executionTime: 5000, // max execution time in ms
        maxMemory: 50000000, // max memory usage in bytes
        memory: 100, // memory threshold for warnings
        products: 1000, // max products to process
        categories: 100, // max categories to process
        compression: 50, // compression ratio threshold
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
