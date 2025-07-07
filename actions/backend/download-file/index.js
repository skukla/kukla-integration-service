/**
 * Download file action for retrieving files from storage
 * @module download-file
 * @description Handles secure file downloads from Adobe I/O Files storage
 */

const { Core } = require('@adobe/aio-sdk');

// Load configuration
const { loadConfig } = require('../../../config');
// Use domain catalogs instead of scattered imports
const { files, shared } = require('../../../src');

/**
 * Validates request parameters and prepares file download
 * @param {Object} params - Action parameters
 * @param {Object} logger - Logger instance
 * @returns {Object} Validated parameters and clean filename
 */
function validateAndPrepareDownload(params, logger) {
  logger.info('Starting download request:', { fileName: params.fileName });

  // Validate required parameters using shared utilities
  const missingInputs = shared.checkMissingParams(params, ['fileName']);
  if (missingInputs) {
    logger.error('Missing required inputs:', { missingInputs });
    throw new Error(missingInputs);
  }

  // Extract clean filename using files domain
  const cleanFileName = files.extractCleanFilename(params.fileName);
  logger.info('Clean filename extracted:', { original: params.fileName, clean: cleanFileName });

  return { cleanFileName };
}

/**
 * Initializes storage and retrieves file metadata
 * @param {string} cleanFileName - Clean filename to download
 * @param {Object} context - Download context
 * @param {Object} context.config - Configuration object
 * @param {Object} context.actionParams - Action parameters
 * @param {Object} context.logger - Logger instance
 * @returns {Promise<Object>} Storage instance and file properties
 */
async function initializeStorageAndGetFileInfo(cleanFileName, context) {
  const { config, actionParams, logger } = context;

  // Initialize storage provider using files domain
  logger.info('Initializing storage provider');
  const storage = await files.initializeStorage(config, actionParams);
  logger.info('Storage provider initialized:', { provider: storage.provider });

  // Get file properties using files domain
  logger.info(`Getting properties for file: ${cleanFileName}`);
  const fileProps = await files.getFileProperties(storage, cleanFileName);
  logger.info('File properties retrieved:', {
    name: fileProps.name,
    size: fileProps.size,
    contentType: fileProps.contentType,
  });

  return { storage, fileProps };
}

/**
 * Reads file content and creates download response
 * @param {Object} fileData - File data and context
 * @param {Object} fileData.storage - Storage instance
 * @param {string} fileData.cleanFileName - Clean filename to read
 * @param {Object} fileData.fileProps - File properties
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Download response
 */
async function readFileAndCreateResponse(fileData, logger) {
  const { storage, cleanFileName, fileProps } = fileData;

  // Read file content using files domain
  logger.info(`Reading file content: ${cleanFileName}`);
  const buffer = await files.readFile(storage, cleanFileName);
  logger.info('File content read successfully', {
    contentLength: buffer.length,
    fileName: cleanFileName,
  });

  // Return raw file content with proper headers (matching master pattern)
  logger.info('Sending file response');
  return {
    statusCode: 200,
    headers: {
      'Content-Type': fileProps.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileProps.name}"`,
      'Cache-Control': 'no-cache',
      'X-Download-Success': 'true',
      'X-File-Name': fileProps.name,
      // Let Adobe I/O Runtime handle CORS automatically
    },
    body: buffer.toString('utf8'), // Return as string for CSV files
  };
}

/**
 * Handles file operation errors with specific error types
 * @param {Error} error - Error that occurred
 * @param {Object} params - Original action parameters
 * @param {Object} logger - Logger instance
 * @returns {Object} Error response
 */
function handleFileError(error, params, logger) {
  logger.error('Error in download-file action:', error);

  // Handle specific file operation errors using files domain
  if (files.isFileOperationError(error)) {
    const errorType = files.getFileErrorType(error);
    switch (errorType) {
      case 'NOT_FOUND':
        logger.warn('File not found:', { fileName: params.fileName });
        return shared.error(new Error(`File not found: ${params.fileName}`), {});
      case 'INVALID_PATH':
        logger.warn('Invalid file path:', { fileName: params.fileName });
        return shared.error(error, {});
      default:
        logger.error('File operation error:', {
          type: errorType,
          message: error.message,
        });
        return shared.error(error, {});
    }
  }

  logger.error('Unexpected error:', error);
  return shared.error(error, {});
}

/**
 * Main function that handles file download requests
 *
 * @param {Object} params - Action parameters
 * @param {string} params.fileName - Name of the file to download
 * @param {string} [params.LOG_LEVEL='info'] - Logging level
 *
 * @returns {Promise<Object>} Action response
 * @property {number} statusCode - HTTP status code (200 for success, 400/404/500 for errors)
 * @property {Object} [headers] - Response headers for successful downloads
 * @property {string} headers.Content-Type - MIME type of the file
 * @property {string} headers.Content-Disposition - Download filename instruction
 * @property {string} headers.Cache-Control - Caching directive
 * @property {string|Object} body - File content or error message
 *
 * @throws {Error} If file operations fail
 */
async function main(params) {
  // Handle preflight requests first
  if (params.__ow_method === 'options') {
    return shared.success({}, 'Preflight success', {});
  }

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate parameters and prepare for download
    const { cleanFileName } = validateAndPrepareDownload(params, logger);

    // Extract action parameters and load configuration
    const actionParams = shared.extractActionParams(params);
    const config = loadConfig(actionParams);

    // Initialize storage and get file information
    const context = { config, actionParams, logger };
    const { storage, fileProps } = await initializeStorageAndGetFileInfo(cleanFileName, context);

    // Read file and create response
    const fileData = { storage, cleanFileName, fileProps };
    return await readFileAndCreateResponse(fileData, logger);
  } catch (error) {
    return handleFileError(error, params, logger);
  }
}

module.exports = {
  main,
};
