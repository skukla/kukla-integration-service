/**
 * Browse files action for managing product export files
 * @module browse-files
 */

const { Core } = require('@adobe/aio-sdk');

// Use domain catalogs instead of scattered imports
const { getDeleteModalHtml, getFileListHtml } = require('./templates');
const { loadConfig } = require('../../../config');
const { files, shared } = require('../../../src');
const { createHtmxResponse } = require('../../../src/htmx/formatting');

/**
 * Creates an HTML response using HTMX formatting
 * @param {string} html - HTML content
 * @param {number} [status=200] - HTTP status code
 * @returns {Object} Response object
 */
function createHtmlResponse(html, status = 200) {
  return createHtmxResponse({
    html,
    status,
  });
}

// Removed: Custom error response function - use shared.error() instead

/**
 * Handles GET requests for file browsing and modal operations
 * @param {Object} params - Request parameters
 * @param {Object} actionParams - Processed action parameters
 * @param {Object} logger - Logger instance
 * @param {Object} storage - Storage provider instance
 * @returns {Promise<Object>} Response object
 */
async function handleGetRequest(params, actionParams, logger, storage) {
  try {
    // Handle modal requests
    if (params.modal === 'delete' && params.fileName) {
      return createHtmlResponse(getDeleteModalHtml(params.fileName, params.fullPath, actionParams));
    }

    // Get file list with metadata using files domain
    logger.info(`Listing files from storage (${storage.provider})`);
    const allFiles = await files.listFiles(storage);

    // Filter for CSV files using files domain
    const csvFiles = files.filterCsvFiles(allFiles);
    logger.info(`Found ${csvFiles.length} CSV files`);

    // Prepare storage information for the template using files domain
    const storageInfo = files.getStorageInfo(storage);

    // Return the file list HTML with storage information
    return createHtmlResponse(getFileListHtml(csvFiles, storageInfo));
  } catch (error) {
    logger.error('Error in GET request:', error);
    const errorObj = new Error(error.message);
    errorObj.status = 500;
    return shared.error(errorObj);
  }
}

/**
 * Handles DELETE requests for file deletion
 * @param {Object} params - Request parameters
 * @param {Object} logger - Logger instance
 * @param {Object} storage - Storage provider instance
 * @returns {Promise<Object>} Response object
 */
async function handleDeleteRequest(params, logger, storage) {
  try {
    const fileName = params.fileName;
    if (!fileName) {
      const errorObj = new Error('File name is required');
      errorObj.status = 400;
      return shared.error(errorObj);
    }

    logger.info(`Deleting file: ${fileName}`);
    await files.deleteFile(storage, fileName);
    return createHtmlResponse('');
  } catch (error) {
    logger.error('Error in DELETE request:', error);
    const errorObj = new Error(error.message);
    errorObj.status = 500;
    return shared.error(errorObj);
  }
}

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
    const storage = await files.initializeStorage(actionParams, config);
    logger.info('Storage provider initialized:', { provider: storage.provider });

    // Route request based on HTTP method
    switch (params.__ow_method) {
      case 'get':
        return handleGetRequest(params, actionParams, logger, storage);
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
