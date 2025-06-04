/**
 * Browse files action for managing product export files
 * @module browse-files
 */

const { Core, Files: FilesLib } = require('@adobe/aio-sdk');

const { getDeleteModalHtml, getFileListHtml } = require('./templates');
const { extractActionParams } = require('../../../src/core/http/client');
const { response, getCorsHeaders } = require('../../../src/core/http/responses');
const { listFiles, deleteFile } = require('../../../src/core/storage/files');
const { createHtmxResponse } = require('../../../src/htmx/formatting');

/**
 * Creates a simple HTML response with CORS headers
 * @param {string} html - HTML content
 * @param {number} [status=200] - HTTP status code
 * @param {Object} params - Request parameters for CORS
 * @returns {Object} Response object
 */
function createHtmlResponse(html, status = 200, params = {}) {
  const baseResponse = createHtmxResponse({
    html,
    status,
  });

  return {
    ...baseResponse,
    headers: {
      ...baseResponse.headers,
      ...getCorsHeaders(params),
    },
  };
}

/**
 * Handles GET requests for file browsing and modal operations
 * @param {Object} params - Request parameters
 * @param {Object} logger - Logger instance
 * @param {Object} files - Files SDK instance
 * @returns {Promise<Object>} Response object
 */
async function handleGetRequest(params, logger, files) {
  try {
    // Handle modal requests
    if (params.modal === 'delete' && params.fileName) {
      return createHtmlResponse(getDeleteModalHtml(params.fileName, params.fullPath), 200, params);
    }

    // List and process files
    logger.info('Checking public directory');
    try {
      // Ensure public directory exists (Files SDK creates directories automatically)
      logger.info('Public directory ensured');
    } catch (error) {
      // Ignore error if directory already exists
      logger.info('Public directory already exists');
    }

    // Get file list with metadata using shared operations
    logger.info('Listing files from public directory');
    const allFiles = await listFiles(files, 'public');

    // Filter for CSV files
    const csvFiles = allFiles.filter((file) => file.name.endsWith('.csv'));
    logger.info(`Found ${csvFiles.length} CSV files`);

    // Return the file list HTML
    return createHtmlResponse(getFileListHtml(csvFiles), 200, params);
  } catch (error) {
    logger.error('Error in GET request:', error);
    return response.error(error, {}, params);
  }
}

/**
 * Handles DELETE requests for file deletion
 * @param {Object} params - Request parameters
 * @param {Object} logger - Logger instance
 * @param {Object} files - Files SDK instance
 * @returns {Promise<Object>} Response object
 */
async function handleDeleteRequest(params, logger, files) {
  try {
    const fileName = params.fileName;
    if (!fileName) {
      return response.badRequest('File name is required', {}, params);
    }

    logger.info(`Deleting file: ${fileName}`);
    await deleteFile(files, fileName);
    return createHtmlResponse('', 200, params);
  } catch (error) {
    logger.error('Error in DELETE request:', error);
    return response.error(error, {}, params);
  }
}

/**
 * Main function that handles file browsing and management
 * @param {Object} rawParams - Action parameters
 * @returns {Promise<Object>} Action response
 */
async function main(rawParams) {
  // Handle OPTIONS requests for CORS preflight
  if (rawParams.__ow_method === 'options') {
    return response.success({}, 'Preflight success', {}, rawParams);
  }

  const params = extractActionParams(rawParams);
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // Initialize Files SDK
    logger.info('Initializing Files SDK');
    const files = await FilesLib.init();
    logger.info('Files SDK initialized successfully');

    // Route request based on HTTP method
    switch (rawParams.__ow_method) {
      case 'get':
        return handleGetRequest(params, logger, files);
      case 'delete':
        return handleDeleteRequest(params, logger, files);
      default:
        return response.badRequest('Method not allowed', {}, rawParams);
    }
  } catch (error) {
    logger.error('Error in main:', error);
    return response.error(error, {}, rawParams);
  }
}

module.exports = {
  main,
};
