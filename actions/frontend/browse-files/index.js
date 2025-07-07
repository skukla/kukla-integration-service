/**
 * Browse files action for managing product export files
 * @module browse-files
 */

const { Core } = require('@adobe/aio-sdk');

// Use domain catalogs instead of scattered imports
const { handleGetRequest, handleDeleteRequest } = require('./lib/request-handlers');
const { loadConfig } = require('../../../config');
const { files, shared } = require('../../../src');

// Import local modules

/**
 * Main action handler for browse-files
 * @param {Object} params - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // Extract action parameters for storage initialization
    const actionParams = shared.extractActionParams(params);

    // Load configuration
    const config = loadConfig(actionParams);

    // Initialize storage using files domain
    const storage = await files.initializeStorage(config, actionParams);
    logger.info('Storage provider initialized:', { provider: storage.provider });

    // Route request based on HTTP method
    switch (params.__ow_method) {
      case 'get': {
        const requestContext = { params, actionParams, logger, storage };
        return handleGetRequest(requestContext);
      }
      case 'delete':
        return handleDeleteRequest(params, logger, storage);
      default: {
        const methodError = new Error('Method not allowed');
        methodError.status = 400;
        return shared.error(methodError);
      }
    }
  } catch (error) {
    logger.error('Error in main:', error);
    const errorObj = new Error(error.message);
    errorObj.status = 500;
    return shared.error(errorObj);
  }
}

module.exports = {
  main,
};
