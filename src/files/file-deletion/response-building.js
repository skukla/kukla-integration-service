/**
 * File Deletion - Response Building Sub-module
 * All response building utilities for file deletion operations
 */

const { response } = require('../../shared/http/responses');

// Response Building Workflows

/**
 * Build success response for file deletion
 * @purpose Create standardized success response for successful deletion
 * @param {string} fileName - Name of deleted file
 * @param {Object} metadata - File metadata before deletion
 * @returns {Object} Success response with deletion confirmation
 * @usedBy deleteFileWithValidation
 */
function buildDeletionSuccessResponse(fileName, metadata) {
  return response.success(
    {
      deleted: true,
      fileName,
      fileMetadata: metadata,
    },
    `File '${fileName}' deleted successfully`,
    {
      operation: 'file-deletion',
      deletedAt: new Date().toISOString(),
    }
  );
}

/**
 * Build basic deletion response
 * @purpose Create simple deletion response for basic operations
 * @param {string} fileName - Name of deleted file
 * @returns {Object} Basic deletion response
 * @usedBy deleteFile
 */
function buildBasicDeletionResponse(fileName) {
  return response.success(
    {
      deleted: true,
      fileName,
    },
    `File '${fileName}' deleted successfully`
  );
}

/**
 * Build batch deletion response
 * @purpose Create response for batch deletion operations
 * @param {Object} batchResult - Result from batch deletion operation
 * @returns {Object} Batch deletion response
 * @usedBy deleteFilesBatch
 */
function buildBatchDeletionResponse(batchResult) {
  const { successful, failed, total } = batchResult;
  const successCount = successful.length;
  const failCount = failed.length;

  return response.success(
    {
      batchDeletion: true,
      summary: {
        total,
        successful: successCount,
        failed: failCount,
      },
      results: {
        successful,
        failed,
      },
    },
    `Batch deletion completed: ${successCount}/${total} files deleted successfully`,
    {
      operation: 'batch-file-deletion',
      deletedAt: new Date().toISOString(),
    }
  );
}

/**
 * Build error response for deletion failures
 * @purpose Create standardized error response for deletion failures
 * @param {Error} error - Error that occurred during deletion
 * @param {string} fileName - Name of file that failed to delete
 * @returns {Object} Error response with appropriate status code
 * @usedBy deleteFileWithValidation, deleteFile
 */
function buildDeletionErrorResponse(error, fileName) {
  let errorType = 'DELETION_ERROR';
  let statusCode = 500;

  // Determine error type and status code
  const errorMessage = error.message.toLowerCase();
  const isFileNotFound =
    errorMessage.includes('not found') || errorMessage.includes('does not exist');
  const isPermissionDenied =
    errorMessage.includes('permission') || errorMessage.includes('access denied');
  const isValidationError =
    errorMessage.includes('validation') || errorMessage.includes('not allowed');

  if (isFileNotFound) {
    errorType = 'FILE_NOT_FOUND';
    statusCode = 404;
  } else if (isValidationError) {
    errorType = 'VALIDATION_ERROR';
    statusCode = 400;
  } else if (isPermissionDenied) {
    errorType = 'DELETION_NOT_ALLOWED';
    statusCode = 403;
  }

  return response.error(`Deletion failed: ${error.message}`, {
    fileName,
    errorType,
    originalError: error.message,
    statusCode,
  });
}

module.exports = {
  // Workflows (used by feature core)
  buildDeletionSuccessResponse,
  buildBasicDeletionResponse,
  buildBatchDeletionResponse,
  buildDeletionErrorResponse,
};
