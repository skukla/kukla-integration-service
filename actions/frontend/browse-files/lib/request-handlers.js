/**
 * Request handlers for browse-files action
 * @module lib/request-handlers
 */

const { files, shared } = require('../../../../src');
const { createHtmxResponse } = require('../../../../src/htmx/formatting');
const { getDeleteModalHtml, getFileListHtml } = require('../templates');

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
 * Handles GET requests for file browsing and modal operations
 * @param {Object} requestContext - Request context
 * @param {Object} requestContext.params - Request parameters
 * @param {Object} requestContext.actionParams - Processed action parameters
 * @param {Object} requestContext.logger - Logger instance
 * @param {Object} requestContext.storage - Storage provider instance
 * @returns {Promise<Object>} Response object
 */
async function handleGetRequest(requestContext) {
  const { params, actionParams, logger, storage } = requestContext;

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

module.exports = {
  handleGetRequest,
  handleDeleteRequest,
};
