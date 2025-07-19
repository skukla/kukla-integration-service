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

  /**
   * Export success response with performance and storage metadata
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {Object} metadata - Export metadata
   * @param {Object} metadata.performance - Performance metrics
   * @param {Object} metadata.storage - Storage information
   * @param {Array} metadata.steps - Processing steps
   * @returns {Object} Formatted export response
   */
  exportSuccess: (data = {}, message = 'Export completed', metadata = {}) => {
    const { performance, storage, steps } = metadata;

    const body = JSON.stringify({
      success: true,
      message,
      ...data,
      ...(performance && { performance }),
      ...(storage && { storage }),
      ...(steps && { steps }),
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body,
    };
  },

  /**
   * JSON data response for API integrations
   * @param {Object} data - Response data with products/items
   * @param {string} message - Success message
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Formatted JSON response
   */
  jsonData: (data = {}, message = 'Data retrieved successfully', metadata = {}) => {
    const body = JSON.stringify({
      success: true,
      message,
      ...data,
      ...metadata,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body,
    };
  },
};

module.exports = {
  response,
};
