/**
 * Core HTTP response utilities
 * @module core/http/responses
 */

const { createErrorResponse: createMonitoringError, processError } = require('../monitoring/errors');
const { HttpCache } = require('../storage/cache');
const { addCompression } = require('./compression');

/**
 * Creates a new response handler state object
 * @param {Object} options - Configuration options
 * @param {boolean} options.isDev - Whether running in development mode
 * @param {Object} [options.logger] - Logger instance (optional, defaults to console)
 * @returns {Object} Response handler state
 */
function createResponseHandlerState({ isDev, logger = console }) {
  return {
    isDev,
    logger,
    steps: []
  };
}

/**
 * Adds a step to the processing history
 * @param {Object} state - Response handler state
 * @param {string} step - Description of the processing step
 * @returns {Object} Updated state with new step
 */
function addStep(state, step) {
  return {
    ...state,
    steps: [...state.steps, step]
  };
}

/**
 * Standard response format for API endpoints with caching and compression
 */
const response = {
  success: async (data = {}, message = 'Success', options = {}) => {
    const baseResponse = {
      statusCode: 200,
      headers: {
        'Content-Type': options.contentType || 'application/json'
      },
      body: {
        success: true,
        message,
        data,
      },
    };
    
    const cachedResponse = HttpCache.addHeaders(baseResponse, options);
    return addCompression(cachedResponse, {
      acceptEncoding: options.acceptEncoding
    });
  },

  error: async (error, context = {}) => {
    const errorResponse = processError(error, context);
    const cachedResponse = HttpCache.addHeaders(errorResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },

  notFound: async (message, context = {}) => {
    const notFoundResponse = createMonitoringError('NOT_FOUND', message, context);
    const cachedResponse = HttpCache.addHeaders(notFoundResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },

  badRequest: async (message, context = {}) => {
    const badRequestResponse = createMonitoringError('VALIDATION', message, context);
    const cachedResponse = HttpCache.addHeaders(badRequestResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },

  unauthorized: async (message, context = {}) => {
    const unauthorizedResponse = createMonitoringError('AUTHENTICATION', message, context);
    const cachedResponse = HttpCache.addHeaders(unauthorizedResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },

  forbidden: async (message, context = {}) => {
    const forbiddenResponse = createMonitoringError('AUTHORIZATION', message, context);
    const cachedResponse = HttpCache.addHeaders(forbiddenResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  },

  tooManyRequests: async (message, context = {}) => {
    const rateLimitResponse = createMonitoringError('RATE_LIMIT', message, context);
    const cachedResponse = HttpCache.addHeaders(rateLimitResponse, { noCache: true });
    return addCompression(cachedResponse, {
      acceptEncoding: context.acceptEncoding
    });
  }
};

/**
 * Creates a success response based on environment
 * @param {Object} state - Response handler state
 * @param {Object} data - Response data
 * @param {Object} [options] - Response options
 * @returns {Object} Formatted response object
 */
function createSuccessResponse(state, data = {}, options = {}) {
  const responseBody = {
    success: true,
    ...data
  };

  // Add environment-specific data
  if (!state.isDev && data.file) {
    responseBody.file = data.file;
  }

  const baseResponse = {
    statusCode: 200,
    headers: {
      'Content-Type': options.contentType || 'application/json'
    },
    body: responseBody
  };

  const cachedResponse = HttpCache.addHeaders(baseResponse, options);
  return addCompression(cachedResponse, {
    acceptEncoding: options.acceptEncoding
  });
}

/**
 * Creates an error response based on environment
 * @param {Object} state - Response handler state
 * @param {Error} error - Error object
 * @param {Object} [context] - Additional context
 * @returns {Object} Formatted error response
 */
function createErrorResponse(state, error, context = {}) {
  state.logger.error('Error:', error.message);

  const errorResponse = processError(error, {
    ...context,
    isDev: state.isDev
  });

  const cachedResponse = HttpCache.addHeaders(errorResponse, { noCache: true });
  return addCompression(cachedResponse, {
    acceptEncoding: context.acceptEncoding
  });
}

/**
 * Determines if file operations should be skipped
 * @param {Object} state - Response handler state
 * @returns {boolean} True if file operations should be skipped
 */
function shouldSkipFileOperations(state) {
  return state.isDev;
}

module.exports = {
  createResponseHandlerState,
  addStep,
  createSuccessResponse,
  createErrorResponse,
  shouldSkipFileOperations,
  response
}; 