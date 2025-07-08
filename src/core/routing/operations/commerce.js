/**
 * Commerce URL operations
 * @module core/routing/operations/commerce
 */

/**
 * Build a Commerce API URL
 * @param {string} baseUrl - Commerce base URL
 * @param {string} path - API endpoint path
 * @param {Object} [pathParams] - Parameters to replace in path
 * @returns {string} Complete Commerce API URL
 */
function buildCommerceUrl(baseUrl, path, pathParams = {}) {
  if (!baseUrl) {
    throw new Error('Commerce base URL is required');
  }

  // Normalize URL components
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.replace(/^\/+/, '');

  // Build API path with REST prefix
  let apiPath = `/rest/all/V1/${normalizedPath}`;

  // Replace path parameters
  Object.entries(pathParams).forEach(([key, value]) => {
    apiPath = apiPath.replace(`:${key}`, encodeURIComponent(value));
  });

  return `${normalizedBaseUrl}${apiPath}`;
}

module.exports = {
  buildCommerceUrl,
};
