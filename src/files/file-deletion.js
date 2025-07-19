/**
 * Files File Deletion
 * Complete file deletion capability with validation and response handling
 */

const {
  buildDeletionSuccessResponse,
  buildDeletionErrorResponse,
} = require('./file-deletion/response-building');
const {
  deleteFileFromStorage,
  deleteBatchFromStorage,
} = require('./file-deletion/storage-operations');
const { validateDeletionRequest } = require('./file-deletion/validation');

/**
 * Delete file with comprehensive validation
 * @purpose Delete file with complete validation, permission checks, and response handling
 * @param {string} fileName - Name of file to delete
 * @param {Object} config - Application configuration with storage and deletion settings
 * @param {Object} params - Deletion parameters including confirmation and validation options
 * @returns {Promise<Object>} Deletion response with success or error information
 * @usedBy File deletion workflows requiring comprehensive validation and error handling
 */
async function deleteFileWithValidation(fileName, config, params) {
  try {
    // Validate deletion request
    validateDeletionRequest(fileName, config, params);

    // Execute deletion
    const deletionResult = await deleteFileFromStorage(fileName, config);

    return buildDeletionSuccessResponse(deletionResult, fileName, config);
  } catch (error) {
    return buildDeletionErrorResponse(error, fileName, config);
  }
}

/**
 * Delete single file without validation
 * @purpose Delete file directly without validation for internal operations
 * @param {string} fileName - Name of file to delete
 * @param {Object} config - Application configuration with storage settings
 * @returns {Promise<Object>} Direct deletion result from storage provider
 * @usedBy Internal deletion operations not requiring validation
 */
async function deleteFile(fileName, config) {
  return await deleteFileFromStorage(fileName, config);
}

/**
 * Delete multiple files in batch
 * @purpose Delete multiple files efficiently with batch processing
 * @param {Array} fileNames - Array of file names to delete
 * @param {Object} config - Application configuration with storage settings
 * @returns {Promise<Object>} Batch deletion results with success and failure counts
 * @usedBy Bulk deletion operations requiring batch processing
 */
async function deleteFilesBatch(fileNames, config) {
  try {
    const batchResult = await deleteBatchFromStorage(fileNames, config);

    return {
      success: true,
      deleted: batchResult.successful,
      failed: batchResult.failed,
      totalRequested: fileNames.length,
      successCount: batchResult.successful.length,
      failureCount: batchResult.failed.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      totalRequested: fileNames.length,
      successCount: 0,
      failureCount: fileNames.length,
    };
  }
}

module.exports = {
  deleteFileWithValidation,
  deleteFile,
  deleteFilesBatch,
};
