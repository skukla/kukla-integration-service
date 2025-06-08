/**
 * Core HTTP response utilities
 * @module core/http/responses
 */

/**
 * Standard response format for OpenWhisk web actions
 * Note: CORS headers are handled automatically by Adobe I/O Runtime for web actions
 */
const response = {
  success: (data = {}, message = 'Success', options = {}) => {
    const body = JSON.stringify({
      success: true,
      message,
      ...data,
      ...(options.steps && { steps: options.steps }),
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': options.cacheControl || 'no-cache',
      },
      body,
    };
  },

  error: (error, context = {}) => {
    const body = JSON.stringify({
      success: false,
      error: error.message,
      ...(error.body && { details: error.body }),
      ...(context.steps && { steps: context.steps }),
    });

    return {
      statusCode: error.status || error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body,
    };
  },

  badRequest: (message, context = {}) => {
    const body = JSON.stringify({
      success: false,
      error: message,
      ...(context.steps && { steps: context.steps }),
    });

    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body,
    };
  },
};

module.exports = {
  response,
};
