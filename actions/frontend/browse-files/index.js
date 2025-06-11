/**
 * Browse files action for managing product export files
 * @module browse-files
 */

const { Core } = require('@adobe/aio-sdk');

const { getDeleteModalHtml, getFileListHtml } = require('./templates');
const { loadConfig } = require('../../../config');
const { extractActionParams } = require('../../../src/core/http/client');
const { initializeAppBuilderStorage, initializeS3Storage } = require('../../../src/core/storage');
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

/**
 * Create JSON error response
 * @param {string} error - Error message
 * @param {number} status - HTTP status code
 * @returns {Object} Response object
 */
function createErrorResponse(error, status) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: false,
      error,
    }),
  };
}

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

    // Get file list with metadata using unified storage interface
    logger.info(`Listing files from storage (${storage.provider})`);
    const allFiles = await storage.list();

    // Filter for CSV files
    const csvFiles = allFiles.filter((file) => file.name.endsWith('.csv'));
    logger.info(`Found ${csvFiles.length} CSV files`);

    // Prepare storage information for the template
    const storageInfo = {
      provider: storage.provider,
      bucket: storage.bucket, // For S3
      namespace: storage.namespace, // For App Builder (if applicable)
    };

    // Return the file list HTML with storage information
    return createHtmlResponse(getFileListHtml(csvFiles, storageInfo));
  } catch (error) {
    logger.error('Error in GET request:', error);
    return createErrorResponse(error.message, 500);
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
      return createErrorResponse('File name is required', 400);
    }

    logger.info(`Deleting file: ${fileName}`);
    await storage.delete(fileName);
    return createHtmlResponse('');
  } catch (error) {
    logger.error('Error in DELETE request:', error);
    return createErrorResponse(error.message, 500);
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
    const actionParams = extractActionParams(params);

    // Load configuration
    const config = loadConfig(actionParams);

    // Initialize storage based on provider
    let storage;
    if (config.storage.provider === 'app-builder') {
      storage = await initializeAppBuilderStorage(actionParams);
    } else {
      storage = await initializeS3Storage(config, actionParams);
    }
    logger.info('Storage provider initialized:', { provider: storage.provider });

    // Route request based on HTTP method
    switch (params.__ow_method) {
      case 'get':
        return handleGetRequest(params, actionParams, logger, storage);
      case 'delete':
        return handleDeleteRequest(params, logger, storage);
      default:
        return createErrorResponse('Method not allowed', 400);
    }
  } catch (error) {
    logger.error('Error in main:', error);
    return createErrorResponse(error.message, 500);
  }
}

module.exports = {
  main,
};
