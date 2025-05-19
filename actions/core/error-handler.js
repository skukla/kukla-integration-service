/**
 * Core error handling module
 * @module actions/core/error-handler
 */

/**
 * Standard error types that map to HTTP status codes
 * @enum {Object}
 */
const ErrorTypes = {
  VALIDATION: {
    status: 400,
    code: 'VALIDATION_ERROR',
    defaultMessage: 'Invalid input provided',
    action: 'Please check your input and try again',
    canRetry: true
  },
  AUTHENTICATION: {
    status: 401,
    code: 'AUTHENTICATION_ERROR',
    defaultMessage: 'Authentication failed',
    action: 'Please refresh the page to log in again',
    canRetry: false
  },
  AUTHORIZATION: {
    status: 403,
    code: 'AUTHORIZATION_ERROR',
    defaultMessage: 'Access denied',
    action: 'You don\'t have permission for this action',
    canRetry: false
  },
  NOT_FOUND: {
    status: 404,
    code: 'NOT_FOUND',
    defaultMessage: 'Resource not found',
    action: 'The requested item was not found',
    canRetry: false
  },
  RATE_LIMIT: {
    status: 429,
    code: 'RATE_LIMIT',
    defaultMessage: 'Too many requests',
    action: 'Please wait a moment and try again',
    canRetry: true
  },
  SYSTEM: {
    status: 500,
    code: 'SYSTEM_ERROR',
    defaultMessage: 'System error occurred',
    action: 'Please try again or contact support if the problem persists',
    canRetry: true
  },
  // Commerce-specific error types
  COMMERCE_AUTH: {
    status: 401,
    code: 'COMMERCE_AUTH_ERROR',
    defaultMessage: 'Commerce authentication failed',
    action: 'Please check your Commerce credentials',
    canRetry: false
  },
  COMMERCE_API: {
    status: 502,
    code: 'COMMERCE_API_ERROR',
    defaultMessage: 'Commerce API request failed',
    action: 'Please try again or check Commerce instance status',
    canRetry: true
  },
  COMMERCE_SYNC: {
    status: 409,
    code: 'COMMERCE_SYNC_ERROR',
    defaultMessage: 'Commerce data synchronization failed',
    action: 'Please check data consistency and try again',
    canRetry: true
  },
  COMMERCE_RATE_LIMIT: {
    status: 429,
    code: 'COMMERCE_RATE_LIMIT',
    defaultMessage: 'Too many Commerce API requests',
    action: 'Please wait before making more requests',
    canRetry: true,
    retryAfter: 60 // seconds
  }
};

/**
 * Creates an error response with consistent structure
 * @param {string} type - Error type from ErrorTypes
 * @param {string} [message] - Custom error message
 * @param {Object} [context] - Additional error context
 * @returns {Object} Formatted error response
 */
function createErrorResponse(type, message, context = {}) {
  const errorType = ErrorTypes[type] || ErrorTypes.SYSTEM;
  
  return {
    statusCode: errorType.status,
    body: {
      success: false,
      error: {
        code: errorType.code,
        message: message || errorType.defaultMessage,
        action: errorType.action,
        canRetry: errorType.canRetry,
        context: {
          ...context,
          errorType: type
        }
      }
    }
  };
}

/**
 * Processes an error and returns appropriate error response
 * @param {Error} error - Error object to process
 * @param {Object} [context] - Additional context
 * @returns {Object} Formatted error response
 */
function processError(error, context = {}) {
  // Handle known error types
  if (error.name === 'ValidationError') {
    return createErrorResponse('VALIDATION', error.message, context);
  }
  
  if (error.name === 'FileOperationError') {
    return createErrorResponse(
      error.type === 'FILE_NOT_FOUND' ? 'NOT_FOUND' : 'SYSTEM',
      error.message,
      context
    );
  }
  
  // Default to system error for unknown errors
  return createErrorResponse('SYSTEM', error.message, {
    ...context,
    originalError: error.toString()
  });
}

module.exports = {
  ErrorTypes,
  createErrorResponse,
  processError
}; 