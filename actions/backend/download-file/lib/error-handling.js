/**
 * Action-specific error handling for download-file
 * @module download-file/lib/error-handling
 */

/**
 * Enhanced error handler that provides context-aware error responses
 * @param {Error} error - The caught error
 * @param {Object} context - Action context for error handling
 * @returns {Object} Formatted error response
 */
function handleDownloadError(error, context) {
  const { files, core, originalParams, logger } = context;

  logger.error('Error in download-file action:', error);

  // Handle specific file operation errors
  if (files.isFileOperationError && files.isFileOperationError(error)) {
    const errorType = files.getFileErrorType(error);
    switch (errorType) {
      case 'NOT_FOUND':
        logger.warn('File not found:', { fileName: originalParams.fileName });
        return core.error(new Error(`File not found: ${originalParams.fileName}`), {});
      case 'INVALID_PATH':
        logger.warn('Invalid file path:', { fileName: originalParams.fileName });
        return core.error(error, {});
      default:
        logger.error('File operation error:', {
          type: errorType,
          message: error.message,
        });
        return core.error(error, {});
    }
  }

  logger.error('Unexpected error:', error);
  return core.error(error, {});
}

module.exports = {
  handleDownloadError,
};
