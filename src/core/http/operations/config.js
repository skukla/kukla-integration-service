/**
 * HTTP Configuration Operations
 * @module core/http/operations/config
 */

const https = require('https');

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

module.exports = {
  createHttpsAgent,
  buildHeaders,
  getBearerToken,
};
