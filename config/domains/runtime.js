/**
 * Runtime Domain Configuration
 * @module config/domains/runtime
 *
 * 🎯 Used by: All Adobe I/O Runtime actions
 * ⚙️ Key settings: Action URLs, package names, routing, logging, technical runtime configuration
 *
 * 📋 Environment settings: Requires RUNTIME_URL from environment
 */

/**
 * Build runtime configuration
 * @param {Object} [params] - Action parameters for environment values
 * @param {Object} [mainConfig] - Shared main configuration (for future shared settings)
 * @returns {Object} Runtime configuration
 */
function buildRuntimeConfig(params = {}, mainConfig = {}) {
  // Note: mainConfig available for future shared settings
  // eslint-disable-next-line no-unused-vars
  mainConfig;

  // Get required values with clear descriptive fallbacks
  const url = params.RUNTIME_URL || process.env.RUNTIME_URL || 'REQUIRED:RUNTIME_URL';

  return {
    url,
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
