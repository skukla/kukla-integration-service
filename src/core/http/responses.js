/**
 * Core HTTP response utilities
 * @module core/http/responses
 */

const { loadConfig } = require('../../../config');

/**
 * Get CORS headers for the response
 * @private
 * @param {Object} params - OpenWhisk parameters containing request headers
 * @returns {Object} CORS headers
 */
function getCorsHeaders(params = {}) {
  // Load configuration when needed
  const config = loadConfig(params);
  const { namespace, baseUrl } = config.url.runtime;

  // Get request origin from headers
  const requestOrigin = params.__ow_headers?.origin;

  // Define allowed origins including development and all deployment environments
  const allowedOrigins = [
    `https://${namespace}.adobeio-static.net`, // Current environment's static domain
    baseUrl, // Current environment's base URL
    'http://localhost:9080', // Development server
    'http://localhost:3000', // Frontend development server
    'https://localhost:9080', // HTTPS development server
    // Additional staging/production domains
    'https://285361-188maroonwallaby-stage.adobeio-static.net', // Staging domain
    'https://285361-188maroonwallaby-prod.adobeio-static.net', // Production domain (if exists)
  ];

  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, Cache-Control, X-Requested-With, hx-current-url, hx-request, hx-target, hx-trigger, hx-trigger-name, hx-prompt, hx-boosted, hx-swap, hx-swap-oob, hx-select, hx-select-oob, hx-push-url, hx-replace-url, hx-confirm, hx-disable, hx-encoding, hx-ext, hx-headers, hx-history, hx-history-elt, hx-include, hx-indicator, hx-params, hx-preserve, hx-sync, hx-validate, hx-vars',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // Set Allow-Origin based on request origin or use first allowed origin as fallback
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    corsHeaders['Access-Control-Allow-Origin'] = requestOrigin;
  } else {
    // Fallback to the current environment's static domain for specific origin
    corsHeaders['Access-Control-Allow-Origin'] = `https://${namespace}.adobeio-static.net`;
  }

  return corsHeaders;
}

/**
 * Handle preflight requests
 * @param {Object} params - OpenWhisk parameters
 * @returns {Object} Preflight response
 */
function handlePreflight(params) {
  return {
    statusCode: 204,
    headers: getCorsHeaders(params),
    body: null,
  };
}

/**
 * Standard response format for OpenWhisk web actions
 */
const response = {
  success: (data = {}, message = 'Success', options = {}, params = {}) => {
    // Handle preflight requests
    if (params.__ow_method === 'options') {
      return handlePreflight(params);
    }

    const body = JSON.stringify({
      success: true,
      message,
      ...data,
      ...(options.steps && { steps: options.steps }),
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': options.cacheControl || 'no-cache',
        ...getCorsHeaders(params),
      },
      body,
    };
  },

  error: (error, context = {}, params = {}) => {
    // Handle preflight requests
    if (params.__ow_method === 'options') {
      return handlePreflight(params);
    }

    const body = JSON.stringify({
      success: false,
      error: error.message,
      ...(error.body && { details: error.body }),
      ...(context.steps && { steps: context.steps }),
    });

    return {
      statusCode: error.status || error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...getCorsHeaders(params),
      },
      body,
    };
  },

  badRequest: (message, context = {}, params = {}) => {
    // Handle preflight requests
    if (params.__ow_method === 'options') {
      return handlePreflight(params);
    }

    const body = JSON.stringify({
      success: false,
      error: message,
      ...(context.steps && { steps: context.steps }),
    });

    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...getCorsHeaders(params),
      },
      body,
    };
  },
};

module.exports = {
  response,
  getCorsHeaders,
};
