/**
 * Runtime Domain Configuration
 * @module config/domains/runtime
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
  };
}

module.exports = {
  buildRuntimeConfig,
};
