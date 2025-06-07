/**
 * URL builder utility
 * @module core/routing/url
 */

const { loadConfig } = require('../../../config');

/**
 * Builds a runtime URL for the given action using environment configuration
 * @param {string} action - The action name
 * @param {string} [customBaseUrl] - Optional custom base URL (for testing)
 * @param {Object} [params] - Action parameters for configuration loading
 * @returns {string} The complete runtime URL
 */
function buildRuntimeUrl(action, customBaseUrl = null, params = {}) {
  // Always use configuration, even for testing mode
  const config = loadConfig(params);
  const { baseUrl, namespace, package: pkg, version, paths } = config.runtime;

  // Use custom base URL if provided (for testing), otherwise use configured baseUrl
  let runtimeBaseUrl = customBaseUrl || baseUrl;

  // For production, convert static domain to runtime domain
  // For staging, keep the static domain as deployments use adobeio-static.net
  const isProduction = config.environment === 'production';
  if (isProduction && runtimeBaseUrl.includes('adobeio-static.net')) {
    runtimeBaseUrl = runtimeBaseUrl.replace('adobeio-static.net', 'adobeioruntime.net');
  }

  // Build the complete URL using environment configuration
  const namespacePath = namespace ? `/${namespace}` : '';
  return `${runtimeBaseUrl}${paths.base}/${version}${paths.web}${namespacePath}/${pkg}/${action}`;
}

/**
 * Builds a Commerce API URL following Adobe Commerce REST API conventions
 * @param {string} baseUrl - The base URL for the commerce instance
 * @param {string} path - The API endpoint path
 * @param {Object} [params] - Path parameters to replace
 * @returns {string} The complete Commerce API URL
 */
function buildCommerceUrl(baseUrl, path, params = {}) {
  if (!baseUrl) {
    throw new Error('Commerce base URL is required');
  }

  // Remove trailing slash from base URL and leading slash from path
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.replace(/^\/+/, '');

  // Construct the API path with proper prefixes
  const apiPath = `/rest/all/V1/${normalizedPath}`;

  // Replace path parameters
  let url = apiPath;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });

  return `${normalizedBaseUrl}${url}`;
}

module.exports = {
  buildRuntimeUrl,
  buildCommerceUrl,
};
