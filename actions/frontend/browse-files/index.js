/**
 * Browse files action for managing product export files
 * @module browse-files
 */

const { Core } = require('@adobe/aio-sdk');

const { getDeleteModalHtml, getFileListHtml } = require('./templates');
const { extractActionParams } = require('../../../src/core/http/client');
const { initializeStorage } = require('../../../src/core/storage');
const { createHtmxResponse } = require('../../../src/htmx/formatting');

/**
 * Creates a simple HTML response with basic CORS headers (avoiding getCorsHeaders)
 * @param {string} html - HTML content
 * @param {number} [status=200] - HTTP status code
 * @returns {Object} Response object
 */
function createHtmlResponse(html, status = 200) {
  const baseResponse = createHtmxResponse({
    html,
    status,
  });

  return {
    ...baseResponse,
    headers: {
      ...baseResponse.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, hx-current-url, hx-request, hx-target, hx-trigger',
    },
  };
}

/**
 * Handles GET requests for file browsing and modal operations
 * @param {Object} params - Request parameters
 * @param {Object} logger - Logger instance
 * @param {Object} storage - Storage provider instance
 * @returns {Promise<Object>} Response object
 */
async function handleGetRequest(params, logger, storage) {
  try {
    // Handle modal requests
    if (params.modal === 'delete' && params.fileName) {
      return createHtmlResponse(getDeleteModalHtml(params.fileName, params.fullPath, params));
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
    // Return simple error without using response module to avoid getCorsHeaders
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
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
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'File name is required',
        }),
      };
    }

    logger.info(`Deleting file: ${fileName}`);
    await storage.delete(fileName);
    return createHtmlResponse('');
  } catch (error) {
    logger.error('Error in DELETE request:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
}

/**
 * Main action handler for browse-files
 * @param {Object} params - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  // Handle preflight requests first
  if (params.__ow_method === 'options') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, hx-current-url, hx-request, hx-target, hx-trigger',
      },
      body: JSON.stringify({
        success: true,
        message: 'Preflight success',
      }),
    };
  }

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // Extract action parameters for storage initialization
    const actionParams = extractActionParams(params);

    // Initialize storage provider
    logger.info('Initializing storage provider');
    const storage = await initializeStorage(actionParams);
    logger.info('Storage provider initialized:', { provider: storage.provider });

    // Route request based on HTTP method
    switch (params.__ow_method) {
      case 'get':
        return handleGetRequest(params, logger, storage);
      case 'delete':
        return handleDeleteRequest(params, logger, storage);
      default:
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: false,
            error: 'Method not allowed',
          }),
        };
    }
  } catch (error) {
    logger.error('Error in main:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
}

module.exports = {
  main,
};
