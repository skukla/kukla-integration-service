/**
 * Shared HTTP headers utilities for actions
 * @module actions/shared/http/headers
 */

/**
 * Common HTTP headers used across the application
 */
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
 * Sanitizes headers for logging by hiding sensitive information
 * @param {Object} headers - Headers object to sanitize
 * @returns {Object} Sanitized headers
 */
function sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    if (sanitized.authorization) {
        sanitized.authorization = '<hidden>';
    }
    return sanitized;
}

module.exports = headers; 