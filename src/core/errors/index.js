/**
 * Core Error Definitions
 *
 * Centralized error types and utilities for the application.
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

module.exports = {
  storage,
};
