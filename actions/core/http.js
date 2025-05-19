/**
 * Core HTTP utilities for actions
 * @module actions/core/http
 */

const fetch = require('node-fetch');
const { createErrorResponse, processError } = require('./error-handler');
const { addCacheHeaders } = require('./cache');
const { addCompression } = require('./compression');
const { createPerformanceMiddleware } = require('./performance');

// Common HTTP headers
const headers = {
  json: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  auth: (token) => ({
    'Authorization': `Bearer ${token}`,
  }),
  commerce: (token) => ({
    ...headers.json,
    ...headers.auth(token),
  }),
};

/**
 * Builds standard headers for HTTP requests
 * @param {string} [token] - Optional bearer token
 * @param {Object} [additional={}] - Additional headers to include
 * @returns {Object} Headers object
 */
function buildHeaders(token, additional = {}) {
    const headers = {
        'Content-Type': 'application/json',
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

/**
 * Builds a full URL by combining base URL and path
 * @param {string} baseUrl - The base URL
 * @param {string} path - The path to append
 * @returns {string} The complete URL
 */
function buildFullUrl(baseUrl, path) {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
}

module.exports = {
    // Headers utilities
    headers,
    buildHeaders,
    getBearerToken,
    
    // Request utilities
    request,
    
    // Response utilities
    response,
    
    // URL utilities
    buildFullUrl,
    APP_PREFIX,

    // Performance middleware
    createPerformanceMiddleware
}; 