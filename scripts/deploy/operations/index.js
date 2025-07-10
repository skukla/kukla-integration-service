/**
 * Deploy Domain Operations
 * Business operations specific to deployment processes
 *
 * Following Strategic Duplication approach - domain-specific utilities
 * for deployment URL building and configuration.
 */

// Domain-specific utilities (strategic duplication for deploy clarity)
const { loadConfig } = require('../../../config');
const { buildRuntimeUrl } = require('../../../src/core/routing');

/**
 * Build Adobe I/O Runtime action URL for deployment
 * Domain-specific version focused on deployment needs
 * @param {string} actionName - Name of action
 * @param {Object} params - Action parameters
 * @returns {string} Built action URL
 */
function buildActionUrl(actionName, params) {
  const config = loadConfig(params);
  return buildRuntimeUrl(actionName, null, config);
}

/**
 * Build download URL for deployment domain
 * Domain-specific version with deployment-focused defaults
 * @param {string} environment - Target environment
 * @param {string} fileName - File name (default: products.csv)
 * @returns {string} Download URL
 */
function buildDownloadUrl(environment, fileName = 'products.csv') {
  const config = loadConfig({ NODE_ENV: environment });
  const actionUrl = buildRuntimeUrl('download-file', null, config);
  return `${actionUrl}?fileName=${fileName}`;
}

/**
 * Build Adobe I/O static app URL for deployment
 * @param {string} environment - Target environment (staging/production)
 * @returns {string} Static app URL
 */
function buildStaticAppUrl(environment) {
  // Get runtime base URL and transform to static domain
  const runtimeUrl = buildActionUrl('', { NODE_ENV: environment });

  return runtimeUrl
    .replace('adobeioruntime.net', 'adobeio-static.net')
    .replace('/api/v1/web/kukla-integration-service/', '/');
}

module.exports = {
  // Domain-specific utilities (strategic duplication for deploy clarity)
  buildActionUrl,
  buildDownloadUrl,
  buildStaticAppUrl,
};
