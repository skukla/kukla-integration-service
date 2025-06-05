/**
 * Download file action for retrieving files from storage
 * @module download-file
 * @description Handles secure file downloads from Adobe I/O Files storage
 */

const { Core, Files: FilesLib } = require('@adobe/aio-sdk');

const { checkMissingRequestInputs } = require('../../../src/core/data');
const { FileErrorType } = require('../../../src/core/errors');
const { response } = require('../../../src/core/http/responses');
const { readFile, getFileProperties } = require('../../../src/core/storage/files');

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
    return response.success({}, 'Preflight success', {}, params);
  }

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    logger.info('Starting download request:', { fileName: params.fileName });

    // Validate required parameters
    const missingInputs = checkMissingRequestInputs(params, ['fileName']);
    if (missingInputs) {
      logger.error('Missing required inputs:', { missingInputs });
      return response.badRequest(missingInputs, {}, params);
    }

    // Initialize Files SDK
    logger.info('Initializing Files SDK');
    const files = await FilesLib.init();

    // Get file properties first to verify existence and get content type
    logger.info(`Getting properties for file: ${params.fileName}`);
    const fileProps = await getFileProperties(files, params.fileName);
    logger.info('File properties retrieved:', {
      name: fileProps.name,
      size: fileProps.size,
      contentType: fileProps.contentType,
    });

    // Read file content
    logger.info(`Reading file content: ${params.fileName}`);
    const buffer = await readFile(files, params.fileName);
    logger.info('File content read successfully', {
      contentLength: buffer.length,
      fileName: params.fileName,
    });

    // Return file content with proper headers (let platform handle CORS)
    logger.info('Sending file response');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/octet-stream', // Set generic binary type for HTMX handling
        'Content-Disposition': `attachment; filename="${fileProps.name}"`,
        'Cache-Control': 'no-cache',
        'X-Download-Success': 'true',
        'X-File-Type': fileProps.contentType, // Keep original content type in custom header
        'X-File-Name': fileProps.name,
        // Explicitly expose custom headers for CORS
        'Access-Control-Expose-Headers':
          'X-Download-Success, X-File-Type, X-File-Name, Content-Disposition',
        // Let Adobe I/O Runtime handle CORS automatically with wildcard
      },
      body: buffer.toString('base64'),
      // Don't set isBase64Encoded to avoid double-encoding
    };
  } catch (error) {
    logger.error('Error in download-file action:', error);

    // Handle specific file operation errors
    if (error.isFileOperationError) {
      switch (error.type) {
        case FileErrorType.NOT_FOUND:
          logger.warn('File not found:', { fileName: params.fileName });
          return response.badRequest(`File not found: ${params.fileName}`, {}, params);
        case FileErrorType.INVALID_PATH:
          logger.warn('Invalid file path:', { fileName: params.fileName });
          return response.badRequest(error.message, {}, params);
        default:
          logger.error('File operation error:', {
            type: error.type,
            message: error.message,
          });
          return response.error(error, {}, params);
      }
    }

    logger.error('Unexpected error:', error);
    return response.error(error, {}, params);
  }
}

module.exports = {
  main,
};
