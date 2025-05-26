/**
 * Response handler for Adobe Commerce Integration Service
 * Pure functions for handling response formatting and step tracking
 * @module actions/core/response-handler
 */

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
 * Creates a success response based on environment
 * @param {Object} state - Response handler state
 * @param {Object} data - Response data
 * @param {Object} [data.file] - File information for production mode
 * @param {string} [data.file.downloadUrl] - Download URL for generated file
 * @param {string} [data.file.fileName] - Name of the generated file
 * @returns {Object} Formatted response object
 */
function createSuccessResponse(state, data = {}) {
  const responseBody = {
    success: true,
    ...data
  };

  if (!state.isDev && data.file) {
    responseBody.file = data.file;
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'message/http'
    },
    body: responseBody
  };
}

/**
 * Creates an error response based on environment
 * @param {Object} state - Response handler state
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
function createErrorResponse(state, error) {
  state.logger.error('Error:', error.message);

  return {
    statusCode: error.statusCode || 500,
    headers: {
      'Content-Type': 'message/http'
    },
    body: {
      success: false,
      error: error.message || 'server error',
      details: state.isDev ? error.stack : undefined
    }
  };
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
  shouldSkipFileOperations
}; 