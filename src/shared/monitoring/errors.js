/**
 * Core error monitoring and handling module
 * @module core/monitoring/errors
 */

/**
 * Standard error types
 * @enum {string}
 */
const ErrorTypes = {
  VALIDATION: {
    code: 'VALIDATION',
    status: 400,
    defaultMessage: 'Invalid input provided',
    action: 'Please check your input and try again',
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    status: 404,
    defaultMessage: 'Resource not found',
    action: 'Please verify the resource exists',
  },
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    status: 403,
    defaultMessage: 'Permission denied',
    action: 'Please check your permissions',
  },
  RATE_LIMIT: {
    code: 'RATE_LIMIT',
    status: 429,
    defaultMessage: 'Too many requests',
    action: 'Please try again later',
  },
  SYSTEM: {
    code: 'SYSTEM_ERROR',
    status: 500,
    defaultMessage: 'Internal system error',
    action: 'Please try again or contact support',
  },
};

/**
 * Creates a standardized error response
 * @param {string} type - Error type from ErrorTypes
 * @param {string} message - Error message
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
        context: context.public ? context.public : undefined,
      },
    },
  };
}

/**
 * Processes an error and returns appropriate error response
 * @param {Error} error - Error object to process
 * @param {Object} [context] - Additional context
 * @returns {Object} Formatted error response
 */
function processError(error, context = {}) {
  // Handle validation errors
  if (error.name === 'ValidationError') {
    return createErrorResponse('VALIDATION', error.message, context);
  }

  // Handle file operation errors
  if (error.name === 'FileOperationError') {
    const type = error.type === 'FILE_NOT_FOUND' ? 'NOT_FOUND' : 'SYSTEM';
    return createErrorResponse(type, error.message, context);
  }

  // Handle rate limit errors
  if (error.name === 'RateLimitError') {
    return createErrorResponse('RATE_LIMIT', error.message, {
      ...context,
      public: { retryAfter: error.retryAfter },
    });
  }

  // Default to system error for unknown errors
  return createErrorResponse('SYSTEM', error.message, {
    ...context,
    originalError: error.toString(),
  });
}

/**
 * Creates an error logger middleware
 * @param {Object} logger - Logger instance
 * @returns {Function} Error logging middleware
 */
function createErrorLoggerMiddleware(logger) {
  return async (error, context = {}) => {
    const { name, message, stack } = error;

    logger.error('Error occurred:', {
      name,
      message,
      context,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined,
    });

    return processError(error, context);
  };
}

module.exports = {
  ErrorTypes,
  processError,
  createErrorLoggerMiddleware,
};
