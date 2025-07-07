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
 * Builds request options for HTTP requests
 * @param {string} url - The URL to make the request to
 * @param {Object} options - Request options
 * @returns {Object} Complete request options
 */
function buildRequestOptions(url, options) {
  const agent = url.startsWith('https:') ? createHttpsAgent() : undefined;
  const method = (options.method || 'GET').toUpperCase();

  const requestOptions = {
    ...options,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    agent,
  };

  // Add body for non-GET/HEAD requests
  if (shouldIncludeBody(method) && options.body) {
    requestOptions.body = normalizeRequestBody(options.body);
  }

  return requestOptions;
}

/**
 * Checks if HTTP method should include a body
 * @param {string} method - HTTP method
 * @returns {boolean} True if method should include body
 */
function shouldIncludeBody(method) {
  return method !== 'GET' && method !== 'HEAD';
}

/**
 * Normalizes request body to string format
 * @param {*} body - Request body
 * @returns {string} Normalized body string
 */
function normalizeRequestBody(body) {
  return typeof body === 'string' ? body : JSON.stringify(body);
}

/**
 * Processes HTTP response and extracts body
 * @param {Response} response - Fetch response object
 * @returns {Promise<*>} Parsed response body
 */
async function processResponseBody(response) {
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
}

/**
 * Creates HTTP error from response
 * @param {Response} response - Fetch response object
 * @param {*} body - Response body
 * @returns {Error} HTTP error with status information
 */
function createHttpError(response, body) {
  const error = new Error(`HTTP error! status: ${response.status}`);
  error.status = response.status;
  error.statusText = response.statusText;
  error.body = body;
  return error;
}

/**
 * Generic HTTP client for making requests
 * @param {string} url - The URL to make the request to
 * @param {Object} options - Request options (method, headers, body, etc.)
 * @returns {Promise<Object>} The response data
 */
async function request(url, options = {}) {
  const requestOptions = buildRequestOptions(url, options);

  try {
    const response = await fetch(url, requestOptions);
    const body = await processResponseBody(response);

    if (!response.ok) {
      throw createHttpError(response, body);
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
    commerce_consumer_key: 'COMMERCE_CONSUMER_KEY',
    commerce_consumer_secret: 'COMMERCE_CONSUMER_SECRET',
    commerce_access_token: 'COMMERCE_ACCESS_TOKEN',
    commerce_access_token_secret: 'COMMERCE_ACCESS_TOKEN_SECRET',
    // Additional Commerce credential mappings
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

  // Handle OAuth credentials passed via headers (for HTTP bridge pattern)
  if (params.__ow_headers) {
    const headers = params.__ow_headers;
    if (headers['x-commerce-consumer-key']) {
      headerParams.COMMERCE_CONSUMER_KEY = headers['x-commerce-consumer-key'];
    }
    if (headers['x-commerce-consumer-secret']) {
      headerParams.COMMERCE_CONSUMER_SECRET = headers['x-commerce-consumer-secret'];
    }
    if (headers['x-commerce-access-token']) {
      headerParams.COMMERCE_ACCESS_TOKEN = headers['x-commerce-access-token'];
    }
    if (headers['x-commerce-access-token-secret']) {
      headerParams.COMMERCE_ACCESS_TOKEN_SECRET = headers['x-commerce-access-token-secret'];
    }
    // Commerce credential headers for HTTP bridge pattern
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

  // Merge and normalize parameters (headers take precedence for OAuth credentials)
  return normalizeParams({ ...cleanParams, ...bodyParams, ...headerParams });
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
