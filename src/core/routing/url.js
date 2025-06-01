/**
 * URL builder utility
 * @module core/routing/url
 */

/**
 * Builds a runtime URL for the given action
 * @param {string} baseUrl - The base URL for the runtime
 * @param {string} action - The action name
 * @returns {string} The complete runtime URL
 */
function buildRuntimeUrl(baseUrl, action) {
  return `${baseUrl}/api/v1/web/kukla-integration-service/${action}`;
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
