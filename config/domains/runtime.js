/**
 * Runtime Domain Configuration
 * @module config/domains/runtime
 *
 * Used by: All Adobe I/O Runtime actions
 * ⚙️ Key settings: Action URLs, package names, routing, logging configuration
 *
 * 📋 Environment settings: Requires RUNTIME_URL from environment
 */

/**
 * Build runtime configuration
 * @param {Object} [params] - Action parameters for environment values
 * @returns {Object} Runtime configuration
 */
function buildRuntimeConfig(params = {}) {
  const url = params.RUNTIME_URL || process.env.RUNTIME_URL;
  if (!url) {
    throw new Error('RUNTIME_URL is required in environment configuration');
  }

  const namespace = params.AIO_runtime_namespace || process.env.AIO_runtime_namespace;
  if (!namespace) {
    throw new Error('AIO_runtime_namespace is required in environment configuration');
  }

  return {
    url,
    namespace,
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
        allowCliDetection: true,
      },
    },
  };
}

module.exports = {
  buildRuntimeConfig,
};
