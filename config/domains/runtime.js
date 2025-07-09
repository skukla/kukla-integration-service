/**
 * Runtime Domain Configuration
 * @module config/domains/runtime
 *
 * 🎯 Used by: All Adobe I/O Runtime actions
 * ⚙️ Key settings: Action URLs, package names, routing, logging
 */

/**
 * Build runtime configuration
 * @param {Object} params - Action parameters
 * @returns {Object} Runtime configuration
 */
function buildRuntimeConfig(params = {}) {
  const runtimeUrl = params.RUNTIME_URL || process.env.RUNTIME_URL;

  return {
    url: runtimeUrl,
    package: 'kukla-integration-service',
    version: 'v1',
    paths: {
      base: '/api',
      web: '/web',
    },
    actions: {
      'get-products': 'get-products',
      'browse-files': 'browse-files',
      'download-file': 'download-file',
      'delete-file': 'delete-file',
      'get-products-mesh': 'get-products-mesh',
    },
    logging: {
      defaultLevel: 'info',
      validLevels: ['debug', 'info', 'warn', 'error', 'trace'],
      debugLevels: ['debug', 'trace'],
      actionLoggerName: 'action',
    },
    environment: {
      cli: {
        timeout: 5000,
        allowCliDetection: true,
      },
      testing: {
        timeout: 10000, // Jest timeout
      },
    },
  };
}

module.exports = {
  buildRuntimeConfig,
};
