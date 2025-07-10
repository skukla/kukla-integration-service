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
  // Detect environment to select appropriate runtime URL
  const { detectEnvironment } = require('../../src/core/environment/operations/detection');
  const environment = detectEnvironment(params);

  // Select environment-specific runtime URL
  let url;
  if (environment === 'staging') {
    url = params.RUNTIME_URL_STAGING || process.env.RUNTIME_URL_STAGING;
  } else if (environment === 'production') {
    url = params.RUNTIME_URL_PRODUCTION || process.env.RUNTIME_URL_PRODUCTION;
  }

  // Fallback to generic RUNTIME_URL if environment-specific not found
  if (!url) {
    url = params.RUNTIME_URL || process.env.RUNTIME_URL || 'REQUIRED:RUNTIME_URL';
  }

  const namespace =
    params.RUNTIME_NAMESPACE || process.env.RUNTIME_NAMESPACE || 'REQUIRED:RUNTIME_NAMESPACE';

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
