/**
 * Shared Error Infrastructure
 * Centralized error types and utilities for the application
 */

/**
 * File operation error types
 * @readonly
 * @enum {string}
 */
const FileErrorType = {
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  UNKNOWN: 'UNKNOWN',
  INVALID_PATH: 'INVALID_PATH',
};

/**
 * Storage-related error definitions
 */
const storage = {
  FileErrorType,
};

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
  storage,
  FileErrorType,
  createError,
};
