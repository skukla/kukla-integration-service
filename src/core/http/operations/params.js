/**
 * HTTP Parameter Processing Operations
 * @module core/http/operations/params
 */

/**
 * Normalizes parameter names to uppercase for consistency
 * @param {Object} params - Parameters to normalize
 * @returns {Object} Normalized parameters
 */
function normalizeParams(params) {
  const normalized = {};
  const paramMap = {
    commerce_url: 'COMMERCE_BASE_URL',
    commerce_admin_username: 'COMMERCE_ADMIN_USERNAME',
    commerce_admin_password: 'COMMERCE_ADMIN_PASSWORD',
  };
  Object.entries(params).forEach(([key, value]) => {
    const normalizedKey = paramMap[key.toLowerCase()] || key;
    normalized[normalizedKey] = value;
  });
  return normalized;
}

/**
 * Extracts and processes parameters from a web action request
 * @param {Object} params - Raw parameters from the request
 * @returns {Object} Processed parameters
 */
function extractActionParams(params) {
  let bodyParams = {};
  let headerParams = {};
  let queryParams = {};

  // Handle parameters passed in __ow_body (common in web actions)
  if (params.__ow_body) {
    try {
      // If body is base64 encoded
      const bodyStr = Buffer.from(params.__ow_body, 'base64').toString('utf8');
      bodyParams = JSON.parse(bodyStr);
    } catch (error) {
      console.warn('Failed to parse body parameters:', error.message);
    }
  }

  // Handle query parameters from __ow_query (URL query string)
  if (params.__ow_query) {
    try {
      // Parse query string parameters
      const queryString = params.__ow_query;
      const urlParams = new URLSearchParams(queryString);
      for (const [key, value] of urlParams) {
        queryParams[key] = decodeURIComponent(value);
      }
    } catch (error) {
      console.warn('Failed to parse query parameters:', error.message);
    }
  }

  // Handle Commerce admin credentials passed via headers
  if (params.__ow_headers) {
    const headers = params.__ow_headers;
    // Commerce admin credential headers for HTTP bridge pattern
    if (headers['x-commerce-username']) {
      headerParams.COMMERCE_ADMIN_USERNAME = headers['x-commerce-username'];
    }
    if (headers['x-commerce-password']) {
      headerParams.COMMERCE_ADMIN_PASSWORD = headers['x-commerce-password'];
    }
  }

  // Remove OpenWhisk specific parameters
  const cleanParams = { ...params };
  ['__ow_body', '__ow_headers', '__ow_method', '__ow_path', '__ow_query'].forEach((key) => {
    delete cleanParams[key];
  });

  // Merge and normalize parameters (query params take precedence, then headers for admin credentials)
  return normalizeParams({ ...cleanParams, ...bodyParams, ...queryParams, ...headerParams });
}

/**
 * Checks for missing required parameters
 * @param {Object} params - Parameters to check
 * @param {string[]} requiredParams - List of required parameter names
 * @returns {string|null} Error message if parameters are missing, null otherwise
 */
function checkMissingParams(params, requiredParams) {
  const missing = requiredParams.filter((param) => !params[param]);
  if (missing.length > 0) {
    return `Missing required parameters: ${missing.join(', ')}`;
  }
  return null;
}

module.exports = {
  normalizeParams,
  extractActionParams,
  checkMissingParams,
};
