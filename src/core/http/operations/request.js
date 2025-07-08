/**
 * HTTP Request Building Operations
 * @module core/http/operations/request
 */

const { createHttpsAgent } = require('./config');

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

module.exports = {
  buildRequestOptions,
  shouldIncludeBody,
  normalizeRequestBody,
};
