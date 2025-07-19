/**
 * Commerce URL operations
 * @module shared/routing/commerce
 */

/**
 * Build a Commerce API URL using configuration
 * @purpose Build complete Commerce API URL from configuration and endpoint path
 * @param {string} endpoint - Endpoint key from config.commerce.paths or raw path
 * @param {Object} config - Application configuration with commerce settings
 * @param {Object} [pathParams={}] - Parameters to replace in path (e.g., :sku, :id)
 * @returns {string} Complete Commerce API URL
 * @usedBy All Commerce API integrations for URL building
 */
function buildCommerceApiUrl(endpoint, config, pathParams = {}) {
  const { commerce } = config;

  if (!commerce || !commerce.baseUrl) {
    throw new Error('Commerce configuration with baseUrl is required');
  }

  // Step 1: Resolve endpoint path from configuration or use raw endpoint
  const endpointPath = commerce.paths[endpoint] || endpoint;

  // Step 2: Build complete API path using configuration
  const { api } = commerce;
  const apiPath = `${api.prefix}/${api.scope}/${api.version}${endpointPath}`;

  // Step 3: Replace path parameters
  let finalPath = apiPath;
  Object.entries(pathParams).forEach(([key, value]) => {
    finalPath = finalPath.replace(`:${key}`, encodeURIComponent(value));
  });

  // Step 4: Combine with base URL
  const normalizedBaseUrl = commerce.baseUrl.replace(/\/$/, '');
  return `${normalizedBaseUrl}${finalPath}`;
}

/**
 * Legacy function for backward compatibility (deprecated)
 * @deprecated Use buildCommerceApiUrl instead
 */
function buildCommerceUrl(baseUrl, path, pathParams = {}) {
  // Legacy implementation for backward compatibility
  if (!baseUrl) {
    throw new Error('Commerce base URL is required');
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  let apiPath = `/rest/all/V1/${normalizedPath}`;

  Object.entries(pathParams).forEach(([key, value]) => {
    apiPath = apiPath.replace(`:${key}`, encodeURIComponent(value));
  });

  return `${normalizedBaseUrl}${apiPath}`;
}

module.exports = {
  buildCommerceApiUrl,
  buildCommerceUrl, // Keep for backward compatibility
};
