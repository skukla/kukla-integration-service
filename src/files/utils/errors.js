/**
 * File Error Handling Utilities
 *
 * Low-level pure functions for file operation error handling.
 * Contains utilities for creating, validating, and transforming file errors.
 */

const {
  storage: { FileErrorType },
} = require('../../core').errors;

/**
 * Creates a file operation error object
 * Pure function that creates structured error objects.
 *
 * @param {string} type - Error type from FileErrorType
 * @param {string} message - Error message
 * @param {Error} [originalError] - Original error that caused this
 * @returns {Object} File operation error object
 */
function createFileOperationError(type, message, originalError = null) {
  return {
    name: 'FileOperationError',
    message,
    type,
    originalError,
    isFileOperationError: true,
  };
}

/**
 * Determines if an object is a file operation error
 * Pure function that checks error object structure.
 *
 * @param {Object} error - Error to check
 * @returns {boolean} True if it's a file operation error
 */
function isFileOperationError(error) {
  return error && error.isFileOperationError === true;
}

/**
 * Maps an error code to error type and retry capability
 * Pure function that maps error codes to standardized error information.
 *
 * @param {string} errorCode - Error code to map
 * @returns {Object} Error type and retry information
 */
function mapErrorCodeToType(errorCode) {
  switch (errorCode) {
    case 'FILE_NOT_FOUND':
      return {
        type: FileErrorType.NOT_FOUND,
        canRetry: false,
      };
    case 'PERMISSION_DENIED':
      return {
        type: FileErrorType.PERMISSION_DENIED,
        canRetry: true,
      };
    case 'EEXIST':
      return {
        type: FileErrorType.ALREADY_EXISTS,
        canRetry: false,
      };
    default:
      return {
        type: FileErrorType.UNKNOWN,
        canRetry: true,
      };
  }
}

/**
 * Creates a user-friendly error message
 * Pure function that transforms technical errors into user-friendly messages.
 *
 * @param {string} operation - Operation description
 * @param {string} errorMessage - Technical error message
 * @param {boolean} canRetry - Whether the operation can be retried
 * @returns {string} User-friendly error message
 */
function createUserFriendlyErrorMessage(operation, errorMessage, canRetry) {
  const baseMessage = `Failed to ${operation}: ${errorMessage}`;
  const action = canRetry
    ? 'Please try again or contact support if the issue persists.'
    : 'Please contact support for assistance.';
  return `${baseMessage} ${action}`;
}

/**
 * Creates a file operation error based on the error code
 * Pure function that creates complete file errors from raw errors.
 *
 * @param {Error} error - Original error
 * @param {string} operation - Operation description for the error message
 * @param {Object} [context] - Additional debug context
 * @returns {Object} File operation error object
 */
function createFileError(error, operation, context = {}) {
  const { type, canRetry } = mapErrorCodeToType(error.code);
  const userMessage = createUserFriendlyErrorMessage(operation, error.message, canRetry);
  return createFileOperationError(type, userMessage, {
    originalError: error,
    operation,
    canRetry,
    ...context,
  });
}

/**
 * Gets content type with fallback
 * Pure function that safely extracts content type from file properties.
 *
 * @param {Object} properties - File properties from SDK
 * @returns {string} Content type
 */
function getContentType(properties) {
  return properties.contentType || 'application/octet-stream';
}

/**
 * Validates a file path and returns any errors
 * Pure function that validates file paths for security and format.
 *
 * @param {string} path - File path to validate
 * @returns {Object|null} File operation error if invalid, null if valid
 */
function validatePath(path) {
  if (!path || typeof path !== 'string') {
    return createFileOperationError(
      FileErrorType.INVALID_PATH,
      'File path must be a non-empty string'
    );
  }
  // Prevent path traversal
  if (path.includes('..')) {
    return createFileOperationError(FileErrorType.INVALID_PATH, 'Path traversal is not allowed');
  }
  return null;
}

/**
 * Removes the 'public/' prefix from a file path
 * Pure function that normalizes file paths by removing public prefix.
 *
 * @param {string} filePath - File path that may contain 'public/' prefix
 * @returns {string} File path without 'public/' prefix
 */
function removePublicPrefix(filePath) {
  return filePath.replace(/^public\//, '');
}

module.exports = {
  createFileOperationError,
  isFileOperationError,
  mapErrorCodeToType,
  createUserFriendlyErrorMessage,
  createFileError,
  getContentType,
  validatePath,
  removePublicPrefix,
};
