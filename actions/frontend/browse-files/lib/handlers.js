/**
 * Action-specific request handlers for browse-files
 * @module browse-files/lib/handlers
 */

const { createHtmxResponse } = require('../../../../src/htmx/formatting');
const { getDeleteModalHtml, getFileListHtml } = require('../templates');

/**
 * Creates an HTML response using HTMX formatting
 */
function createHtmlResponse(html, status = 200) {
  return createHtmxResponse({
    html,
    status,
  });
}

/**
 * Handles GET requests for file browsing and modal operations
 * @param {Object} context - Action context with storage initialized
 * @returns {Promise<Object>} HTMX HTML response
 */
async function handleGetRequest(context) {
  const { files, extractedParams, webActionParams, logger, storage } = context;
  const allActionParams = { ...webActionParams, ...extractedParams };

  // Handle modal requests
  if (allActionParams.modal === 'delete' && allActionParams.fileName) {
    return createHtmlResponse(
      getDeleteModalHtml(allActionParams.fileName, allActionParams.fullPath, extractedParams)
    );
  }

  // Get file list with metadata
  logger.info(`Listing files from storage (${storage.provider})`);
  const allFiles = await files.listFiles(storage);

  // Filter for CSV files
  const csvFiles = files.filterCsvFiles(allFiles);
  logger.info(`Found ${csvFiles.length} CSV files`);

  // Prepare storage information for the template
  const storageInfo = files.getStorageInfo(storage);

  // Return the file list HTML
  return createHtmlResponse(getFileListHtml(csvFiles, storageInfo));
}

/**
 * Handles DELETE requests for file deletion
 * @param {Object} context - Action context with storage initialized
 * @returns {Promise<Object>} HTMX HTML response
 */
async function handleDeleteRequest(context) {
  const { files, extractedParams, webActionParams, logger, storage } = context;
  const allActionParams = { ...webActionParams, ...extractedParams };

  const fileName = allActionParams.fileName;
  if (!fileName) {
    const errorObj = new Error('File name is required');
    errorObj.status = 400;
    throw errorObj;
  }

  logger.info(`Deleting file: ${fileName}`);
  await files.deleteFile(storage, fileName);
  return createHtmlResponse('');
}

/**
 * Routes requests based on HTTP method
 * @param {Object} context - Action context with storage initialized
 * @returns {Promise<Object>} Routed response
 */
async function routeRequest(context) {
  const { webActionParams, extractedParams } = context;
  const allActionParams = { ...webActionParams, ...extractedParams };

  switch (allActionParams.__ow_method) {
    case 'get':
      return await handleGetRequest(context);
    case 'delete':
      return await handleDeleteRequest(context);
    default: {
      const methodError = new Error('Method not allowed');
      methodError.status = 400;
      throw methodError;
    }
  }
}

module.exports = {
  createHtmlResponse,
  handleGetRequest,
  handleDeleteRequest,
  routeRequest,
};
