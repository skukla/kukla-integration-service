/**
 * Download file action for retrieving files from storage
 * @module download-file
 * @description Handles secure file downloads from Adobe I/O Files storage
 */

const { Core, Files: FilesLib } = require('@adobe/aio-sdk');

const {
  data: { checkMissingRequestInputs },
  storage: { readFile, getFileProperties, FileOperationError, FileErrorType },
} = require('../../../src/core');
const { response } = require('../../../src/core/http/responses');

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

    // Return file content with proper headers and CORS
    logger.info('Sending file response');
    const successResponse = response.success({}, 'File download successful', {}, params);
    return {
      ...successResponse,
      headers: {
        ...successResponse.headers,
        'Content-Type': fileProps.contentType,
        'Content-Disposition': `attachment; filename="${fileProps.name}"`,
        'Cache-Control': 'no-cache',
        'X-Download-Success': 'true',
      },
      body: buffer.toString('base64'),
    };
  } catch (error) {
    logger.error('Error in download-file action:', error);

    // Handle specific file operation errors
    if (error instanceof FileOperationError) {
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
