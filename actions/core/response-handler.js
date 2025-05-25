/**
 * Response handler for Adobe Commerce Integration Service
 * Handles environment-specific response formatting and step tracking
 * @module actions/core/response-handler
 */

class ResponseHandler {
  /**
   * Creates a new response handler
   * @param {Object} options - Configuration options
   * @param {boolean} options.isDev - Whether running in development mode
   * @param {Object} [options.logger] - Logger instance (optional, defaults to console)
   */
  constructor({ isDev, logger = console }) {
    this.isDev = isDev;
    this.logger = logger;
    this.steps = [];
  }

  /**
   * Adds a step to the processing history
   * @param {string} step - Description of the processing step
   */
  addStep(step) {
    this.steps.push(step);
  }

  /**
   * Creates a success response based on environment
   * @param {Object} data - Response data
   * @param {Object} [data.file] - File information for production mode
   * @param {string} [data.file.downloadUrl] - Download URL for generated file
   * @param {string} [data.file.fileName] - Name of the generated file
   * @returns {Object} Formatted response object
   */
  success(data = {}) {
    const responseBody = {
      success: true,
      ...data
    };

    if (!this.isDev && data.file) {
      responseBody.file = data.file;
    }

    return {
      statusCode: 200,
      body: responseBody
    };
  }

  /**
   * Creates an error response based on environment
   * @param {Error} error - Error object
   * @returns {Object} Formatted error response
   */
  error(error) {
    this.logger.error('Error:', error.message);

    return {
      statusCode: error.statusCode || 500,
      body: {
        success: false,
        error: error.message || 'server error',
        details: this.isDev ? error.stack : undefined
      }
    };
  }

  /**
   * Determines if file operations should be skipped
   * @returns {boolean} True if file operations should be skipped
   */
  shouldSkipFileOperations() {
    return this.isDev;
  }
}

module.exports = ResponseHandler; 