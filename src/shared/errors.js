/**
 * Core error types and utilities
 * @module core/errors
 */

/**
 * File operation error types
 * @enum {string}
 */
const FileErrorType = {
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_PATH: 'INVALID_PATH',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Storage operation error types
 * @enum {string}
 */
const StorageErrorType = {
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  OPERATION_FAILED: 'OPERATION_FAILED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  UNKNOWN: 'UNKNOWN',
};

/**
 * HTTP error types
 * @enum {string}
 */
const HttpErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN',
};

module.exports = {
  storage: {
    FileErrorType,
    StorageErrorType,
  },
  http: {
    HttpErrorType,
  },
};
