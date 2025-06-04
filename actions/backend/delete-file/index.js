/**
 * Delete file action for removing files from storage
 * @module delete-file
 */

const { Core, Files: FilesLib } = require('@adobe/aio-sdk');

const {
  data: { checkMissingRequestInputs },
  storage: { deleteFile, FileOperationError, FileErrorType },
} = require('../../../src/core');
const { response } = require('../../../src/core/http/responses');

/**
 * Main function that handles file deletion
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  // Handle preflight requests first
  if (params.__ow_method === 'options') {
    return response.success({}, 'Preflight success', {}, params);
  }

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters
    const requiredParams = ['fileName'];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return response.badRequest(missingParams, {}, params);
    }

    // Initialize Files SDK
    logger.info('Initializing Files SDK');
    const files = await FilesLib.init();

    // Delete the file using shared operations
    logger.info(`Deleting file: ${params.fileName}`);
    await deleteFile(files, params.fileName);

    // Return empty response for HTMX to remove the row
    const successResponse = response.success({}, 'File deleted successfully', {}, params);
    return {
      ...successResponse,
      headers: {
        ...successResponse.headers,
        'Content-Type': 'text/html',
      },
      body: '',
    };
  } catch (error) {
    logger.error('Error in delete-file action:', error);

    // Handle specific file operation errors
    if (error instanceof FileOperationError) {
      switch (error.type) {
        case FileErrorType.NOT_FOUND:
          return response.badRequest(`File not found: ${params.fileName}`, {}, params);
        case FileErrorType.INVALID_PATH:
          return response.badRequest(error.message, {}, params);
        default:
          return response.error(error, {}, params);
      }
    }

    return response.error(error, {}, params);
  }
}

module.exports = {
  main,
};
