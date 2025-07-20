/**
 * Core HTTP response utilities
 * @module core/http/responses
 */

const { HTTP_STATUS } = require('./status-codes');
const { validateErrorParameter } = require('../action/response-validation');

// Constants
const CONTENT_TYPE_JSON = 'application/json';

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
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
        'Cache-Control': options.cacheControl || 'no-cache',
      },
      body,
    };
  },

  error: (error, context = {}) => {
    // Validate and fix error parameter type
    const { error: validatedError, warning } = validateErrorParameter(error);

    // Log warning in development to catch these issues early
    if (warning && process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  Response validation: ${warning}`);
    }

    const body = JSON.stringify({
      success: false,
      error: validatedError.message,
      ...(validatedError.body && { details: validatedError.body }),
      ...(context.steps && { steps: context.steps }),
    });

    return {
      statusCode:
        validatedError.status || validatedError.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
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
      statusCode: HTTP_STATUS.BAD_REQUEST,
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
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
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
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
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
        'Cache-Control': 'no-cache',
      },
      body,
    };
  },

  /**
   * HTML response for HTMX interactions
   * @param {string} htmlContent - HTML content to return
   * @param {Object} options - Response options including custom headers
   * @returns {Object} Formatted HTML response
   */
  html: (htmlContent, options = {}) => {
    const { headers: customHeaders = {}, statusCode = HTTP_STATUS.OK } = options;

    return {
      statusCode,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
        ...customHeaders,
      },
      body: htmlContent,
    };
  },
};

module.exports = {
  response,
};
