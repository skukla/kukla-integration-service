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
 * Builds a commerce URL for the given path
 * @param {string} baseUrl - The base URL for the commerce instance
 * @param {string} path - The path to append
 * @param {Object} [params] - Path parameters
 * @returns {string} The complete commerce URL
 */
function buildCommerceUrl(baseUrl, path, params = {}) {
  if (!baseUrl) {
    throw new Error('Commerce base URL is required');
  }

  // Remove trailing slash from base URL
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  // For admin token endpoint
  if (path === 'adminToken') {
    return `${normalizedBaseUrl}/rest/V1/integration/admin/token`;
  }

  // Ensure path starts with a slash and remove any trailing slashes
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Replace path parameters
  let url = normalizedPath;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });

  return `${normalizedBaseUrl}${url}`;
}

module.exports = {
  buildRuntimeUrl,
  buildCommerceUrl,
};
