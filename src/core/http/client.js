/**
 * HTTP client utilities
 * @module core/http/client
 *
 * Functionally composed HTTP client system using operation modules:
 * - config: HTTPS agents, headers, and authentication tokens
 * - request: Request building and body normalization
 * - response: Response processing and error handling
 * - params: Adobe I/O Runtime parameter extraction and normalization
 * - client: Core HTTP request execution
 */

// Import operation modules
const { request } = require('./operations/client');
const { buildHeaders, getBearerToken } = require('./operations/config');
const { normalizeParams, extractActionParams, checkMissingParams } = require('./operations/params');

// Export HTTP client API using functional composition
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
