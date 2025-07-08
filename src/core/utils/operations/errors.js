/**
 * Error operations for utilities
 * @module core/utils/operations/errors
 */

/**
 * Create a standardized error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error object
 */
function createError(message, code = 'UNKNOWN_ERROR', details = {}) {
  return {
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  createError,
};
