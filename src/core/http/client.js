/**
 * HTTP client utilities
 * @module core/http/client
 */
const fetch = require('node-fetch');

/**
 * Builds standard headers for HTTP requests
 * @param {string} [token] - Optional bearer token
 * @param {Object} [additional={}] - Additional headers to include
 * @returns {Object} Headers object
 */
function buildHeaders(token, additional = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...additional
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Extracts and returns the bearer token from request parameters
 * @param {Object} params - Request parameters
 * @returns {string|undefined} Bearer token if present
 */
function getBearerToken(params) {
    const headers = params.__ow_headers || {};
    const authHeader = headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    return match ? match[1] : undefined;
}

/**
 * Generic HTTP client for making requests
 * @param {string} url - The URL to make the request to
 * @param {Object} options - Request options (method, headers, body, etc.)
 * @returns {Promise<Response>} The response from the request
 */
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
}

/**
 * Normalizes parameter names to uppercase for consistency
 * @param {Object} params - Parameters to normalize
 * @returns {Object} Normalized parameters
 */
function normalizeParams(params) {
  const normalized = {};
  const paramMap = {
    'commerce_url': 'COMMERCE_URL',
    'commerce_admin_username': 'COMMERCE_ADMIN_USERNAME',
    'commerce_admin_password': 'COMMERCE_ADMIN_PASSWORD'
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
  // Handle parameters passed in __ow_body (common in web actions)
  if (params.__ow_body) {
    try {
      // If body is base64 encoded
      if (params.__ow_body && params.__ow_headers && params.__ow_headers['content-type'] === 'application/json') {
        const bodyStr = Buffer.from(params.__ow_body, 'base64').toString('utf8');
        const bodyParams = JSON.parse(bodyStr);
        return normalizeParams({ ...params, ...bodyParams });
      }
    } catch (e) {
      console.warn('Failed to parse request body:', e);
    }
  }
  // Normalize parameters even if no __ow_body
  return normalizeParams(params);
}

/**
 * Checks for missing required parameters
 * @param {Object} params - Parameters to check
 * @param {string[]} requiredParams - List of required parameter names
 * @returns {string|null} Error message if parameters are missing, null otherwise
 */
function checkMissingParams(params, requiredParams) {
  const missing = requiredParams.filter(param => !params[param]);
  if (missing.length > 0) {
    return `Missing required parameters: ${missing.join(', ')}`;
  }
  return null;
}

module.exports = {
    // Headers utilities
    buildHeaders,
    getBearerToken,
    // Request utilities
    request,
    // Parameter handling
    normalizeParams,
    extractActionParams,
    checkMissingParams
}; 