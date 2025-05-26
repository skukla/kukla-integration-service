/**
 * Core HTTP utilities for actions
 * @module actions/core/http
 */
const fetch = require('node-fetch');
const { createErrorResponse, processError } = require('./errors');
const { addCacheHeaders } = require('./cache');
const { addCompression } = require('./compression');
const { createPerformanceMiddleware } = require('./performance');
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
 * Standard response format for API endpoints with caching and compression
 */
const response = {
  success: async (data = {}, message = 'Success', options = {}) => {
    const baseResponse = {
      statusCode: 200,
      body: {
        success: true,
        message,
        data,
      },
    };
    // Add cache headers
    const cachedResponse = addCacheHeaders(baseResponse, options);
    // Add compression if needed
    return addCompression(cachedResponse, {
      acceptEncoding: options.acceptEncoding
    });
  },
  error: async (error, context = {}) => {
    const errorResponse = processError(error, context);
    const cachedResponse = addCacheHeaders(errorResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },
  notFound: async (message, context = {}) => {
    const notFoundResponse = createErrorResponse('NOT_FOUND', message, context);
    const cachedResponse = addCacheHeaders(notFoundResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },
  badRequest: async (message, context = {}) => {
    const badRequestResponse = createErrorResponse('VALIDATION', message, context);
    const cachedResponse = addCacheHeaders(badRequestResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },
  unauthorized: async (message, context = {}) => {
    const unauthorizedResponse = createErrorResponse('AUTHENTICATION', message, context);
    const cachedResponse = addCacheHeaders(unauthorizedResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },
  forbidden: async (message, context = {}) => {
    const forbiddenResponse = createErrorResponse('AUTHORIZATION', message, context);
    const cachedResponse = addCacheHeaders(forbiddenResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },
  tooManyRequests: async (message, context = {}) => {
    const rateLimitResponse = createErrorResponse('RATE_LIMIT', message, context);
    const cachedResponse = addCacheHeaders(rateLimitResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  }
};
const APP_PREFIX = '/api/v1/web/kukla-integration-service';
module.exports = {
    // Headers utilities
    buildHeaders,
    getBearerToken,
    // Request utilities
    request,
    // Response utilities
    response,
    // URL utilities
    APP_PREFIX,
    // Performance middleware
    createPerformanceMiddleware,
    // Parameter handling
    extractActionParams,
    checkMissingParams
}; 