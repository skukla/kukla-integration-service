/**
 * Delete file action for removing files from storage
 * @module delete-file
 */

const { Core } = require('@adobe/aio-sdk');

const { checkMissingRequestInputs } = require('../../../src/core/data');
const { FileErrorType } = require('../../../src/core/errors');
const { extractActionParams } = require('../../../src/core/http/client');
const { response } = require('../../../src/core/http/responses');
const { initializeStorage } = require('../../../src/core/storage');
const { extractCleanFilename } = require('../../../src/core/storage/path');

/**
 * Main function that handles file deletion
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  // Handle preflight requests first
  if (params.__ow_method === 'options') {
    return response.success({}, 'Preflight success', {});
  }

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters
    const requiredParams = ['fileName'];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return response.badRequest(missingParams, {});
    }

    // Extract clean filename (remove public/ prefix if present)
    const cleanFileName = extractCleanFilename(params.fileName);
    logger.info('Delete operation starting:', { original: params.fileName, clean: cleanFileName });

    // Extract action parameters for storage credentials
    const actionParams = extractActionParams(params);

    // Initialize storage provider
    const storage = await initializeStorage(actionParams);

    // Delete the file using unified storage interface with clean filename
    await storage.delete(cleanFileName);
    logger.info(`File deleted successfully: ${cleanFileName}`);

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
          return response.badRequest(`File not found: ${params.fileName}`, {});
        case FileErrorType.INVALID_PATH:
          return response.badRequest(error.message, {});
        default:
          return response.error(error, {});
      }
    }

    return response.error(error, {});
  }
}

module.exports = {
  main,
};
