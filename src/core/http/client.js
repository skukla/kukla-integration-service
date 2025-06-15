/**
 * HTTP client utilities
 * @module core/http/client
 */
const https = require('https');

const fetch = require('node-fetch');
/**
 * Creates an HTTPS agent that accepts self-signed certificates
 * @returns {https.Agent} HTTPS agent
 */
function createHttpsAgent() {
  return new https.Agent({
    rejectUnauthorized: false,
  });
}
/**
 * Builds standard headers for HTTP requests
 * @param {string} [token] - Optional bearer token
 * @param {Object} [additional={}] - Additional headers to include
 * @returns {Object} Headers object
 */
function buildHeaders(token, additional = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...additional,
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
 * @returns {Promise<Object>} The response data
 */
async function request(url, options = {}) {
  const agent = url.startsWith('https:') ? createHttpsAgent() : undefined;
  // Ensure method is uppercase
  const method = (options.method || 'GET').toUpperCase();
  // Build request options
  const requestOptions = {
    ...options,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    agent,
  };
  // Handle request body
  if (method !== 'GET' && method !== 'HEAD' && options.body) {
    requestOptions.body =
      typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }
  try {
    const response = await fetch(url, requestOptions);
    const contentType = response.headers.get('content-type');
    let body;
    if (contentType && contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.statusText = response.statusText;
      error.body = body;
      throw error;
    }
    return {
      statusCode: response.status,
      headers: response.headers,
      body,
    };
  } catch (error) {
    console.warn(`Request failed for ${url}:`, error.message);
    throw error;
  }
}
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
  // Remove OpenWhisk specific parameters
  const cleanParams = { ...params };
  ['__ow_body', '__ow_headers', '__ow_method', '__ow_path', '__ow_query'].forEach((key) => {
    delete cleanParams[key];
  });
  // Merge and normalize parameters
  return normalizeParams({ ...cleanParams, ...bodyParams });
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
  // Headers utilities
  buildHeaders,
  getBearerToken,
  // Request utilities
  request,
  // Parameter handling
  normalizeParams,
  extractActionParams,
  checkMissingParams,
};
