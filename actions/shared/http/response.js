/**
 * Shared HTTP response utilities for actions
 * @module actions/shared/http/response
 */

/**
 * Standard response format for API endpoints
 */
const response = {
  success: (data = {}, message = 'Success') => ({
    statusCode: 200,
    body: {
      success: true,
      message,
      data,
    },
  }),

  error: (error, statusCode = 500) => ({
    statusCode,
    body: {
      success: false,
      message: error.message || 'Internal server error',
      error: error.stack,
    },
  }),

  notFound: (message = 'Resource not found') => ({
    statusCode: 404,
    body: {
      success: false,
      message,
    },
  }),

  badRequest: (message = 'Invalid request') => ({
    statusCode: 400,
    body: {
      success: false,
      message,
    },
  }),
};

module.exports = response; 