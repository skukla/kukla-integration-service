/**
 * Delete file action for removing files from storage
 * @module delete-file
 */

const { Core, Files: FilesLib } = require('@adobe/aio-sdk');

const { checkMissingRequestInputs } = require('../../../src/core/data');
const { FileErrorType } = require('../../../src/core/errors');
const { response } = require('../../../src/core/http/responses');
const { deleteFile } = require('../../../src/core/storage/files');

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

    logger.info(`Deleting file: ${params.fileName}`);

    // Initialize Files SDK
    const files = await FilesLib.init();

    // Delete the file using shared operations
    await deleteFile(files, params.fileName);
    logger.info(`File deleted successfully: ${params.fileName}`);

    // Get updated file list by calling browse-files action
    const { main: browseFilesMain } = require('../../frontend/browse-files/index');

    // Call browse-files with GET method to get the updated file list
    const fileListResponse = await browseFilesMain({
      ...params,
      __ow_method: 'get',
      modal: null, // Ensure we don't return modal content
    });

    // Return the updated file list response
    logger.info('Delete operation completed successfully');
    return fileListResponse;
  } catch (error) {
    logger.error('Error in delete-file action:', error);

    // Handle specific file operation errors
    if (error.isFileOperationError) {
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
