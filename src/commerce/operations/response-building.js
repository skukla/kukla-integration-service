/**
 * Commerce Response Building Operations
 *
 * Response building for commerce operations.
 * Uses core response patterns instead of complex domain-specific builders.
 */

const { response } = require('../../core/http/responses');

/**
 * Build success response for enrichment operations
 * Simple wrapper around core response.success()
 *
 * @param {Object} data - Response data (products, stats, etc.)
 * @param {string} message - Success message
 * @param {Object} metadata - Optional metadata (performance, validation, etc.)
 * @returns {Object} Success response
 */
function buildSuccessResponse(data, message = 'Operation completed successfully', metadata = {}) {
  return response.success(data, message, metadata);
}

/**
 * Build error response for commerce operations
 * Simple wrapper around core response.error()
 *
 * @param {Error} error - Error object
 * @param {Object} context - Optional context (steps, operation info, etc.)
 * @returns {Object} Error response
 */
function buildErrorResponse(error, context = {}) {
  return response.error(error, context);
}

/**
 * Build empty result response
 * For operations that complete successfully but return no data
 *
 * @param {string} message - Message explaining why result is empty
 * @param {Object} context - Optional context
 * @returns {Object} Success response with empty data
 */
function buildEmptyResponse(message = 'No data found', context = {}) {
  return response.success({}, message, context);
}

module.exports = {
  buildSuccessResponse,
  buildErrorResponse,
  buildEmptyResponse,
};
