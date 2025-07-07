/**
 * Delete file action for removing files from storage
 * @module delete-file
 */

const { Core } = require('@adobe/aio-sdk');

// Use domain catalogs instead of scattered imports
const { files, shared } = require('../../../src');

/**
 * Main function that handles file deletion
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  // Handle preflight requests first
  if (params.__ow_method === 'options') {
    return shared.success({}, 'Preflight success', {});
  }

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters using shared utilities
    const missingParams = shared.checkMissingParams(params, ['fileName']);
    if (missingParams) {
      return shared.error(new Error(missingParams), {});
    }

    // Extract clean filename using files domain
    const cleanFileName = files.extractCleanFilename(params.fileName);
    logger.info('Delete operation starting:', { original: params.fileName, clean: cleanFileName });

    // Extract action parameters for storage credentials
    const actionParams = shared.extractActionParams(params);

    // Initialize storage provider using files domain
    const storage = await files.initializeStorage(actionParams);

    // Delete the file using files domain
    await files.deleteFile(storage, cleanFileName);
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

    // Handle specific file operation errors using files domain
    if (files.isFileOperationError(error)) {
      const errorType = files.getFileErrorType(error);
      switch (errorType) {
        case 'NOT_FOUND':
          return shared.error(new Error(`File not found: ${params.fileName}`), {});
        case 'INVALID_PATH':
          return shared.error(error, {});
        default:
          return shared.error(error, {});
      }
    }

    return shared.error(error, {});
  }
}

module.exports = {
  main,
};
