/**
 * Files File Deletion - Feature Core
 * Complete file deletion capability - Feature Core with Sub-modules
 */

// Import from feature sub-modules (same domain)
const {
  buildDeletionSuccessResponse,
  buildBasicDeletionResponse,
  buildBatchDeletionResponse,
  buildDeletionErrorResponse,
} = require('./file-deletion/response-building');
const {
  deleteFileFromStorage,
  getFileMetadataBeforeDeletion,
  deleteBatchFromStorage,
} = require('./file-deletion/storage-operations');
const { validateDeletionRequest, cleanFileName } = require('./file-deletion/validation');

// Business Workflows

/**
 * Complete file deletion workflow with comprehensive validation and response
 * @purpose Execute complete file deletion workflow with pre-deletion validation and post-deletion confirmation
 * @param {string} fileName - Name of the file to delete
 * @param {Object} config - Complete configuration object
 * @param {Object} params - Action parameters containing credentials
 * @param {Object} [options={}] - Deletion options including force delete and validation settings
 * @returns {Promise<Object>} Complete deletion result with confirmation and updated file listing
 * @throws {Error} When file access fails or deletion is not permitted
 * @usedBy delete-file action
 */
async function deleteFileWithValidation(fileName, config, params, options = {}) {
  try {
    // Step 1: Validate deletion request and file existence
    await validateDeletionRequest(fileName, config, params, options);

    // Step 2: Clean filename for storage operations
    const cleanedFileName = cleanFileName(fileName, config);

    // Step 3: Get file metadata before deletion (for confirmation)
    const preDeleteMetadata = await getFileMetadataBeforeDeletion(cleanedFileName, config, params);

    // Step 4: Execute file deletion
    await deleteFileFromStorage(cleanedFileName, config, params);

    // Step 5: Verify deletion and build success response
    return buildDeletionSuccessResponse(fileName, preDeleteMetadata);
  } catch (error) {
    return buildDeletionErrorResponse(error, fileName);
  }
}

/**
 * Basic file deletion workflow
 * @purpose Delete file with minimal validation and basic response
 * @param {string} fileName - Name of the file to delete
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Basic deletion result
 * @usedBy Simple file management operations
 */
async function deleteFile(fileName, config, params) {
  try {
    // Step 1: Clean filename for storage operations
    const cleanedFileName = cleanFileName(fileName, config);

    // Step 2: Execute file deletion
    await deleteFileFromStorage(cleanedFileName, config, params);

    // Step 3: Build basic response
    return buildBasicDeletionResponse(fileName);
  } catch (error) {
    return buildDeletionErrorResponse(error, fileName);
  }
}

/**
 * Batch file deletion workflow
 * @purpose Delete multiple files with batch processing and summary response
 * @param {Array} fileNames - Array of filenames to delete
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @param {Object} [options={}] - Batch deletion options
 * @returns {Promise<Object>} Batch deletion result with summary
 * @usedBy Bulk file management operations
 */
async function deleteFilesBatch(fileNames, config, params) {
  try {
    // Step 1: Clean all filenames
    const cleanedFileNames = fileNames.map((fileName) => cleanFileName(fileName, config));

    // Step 2: Execute batch deletion
    const batchResult = await deleteBatchFromStorage(cleanedFileNames, config, params);

    // Step 3: Build batch response
    return buildBatchDeletionResponse(batchResult);
  } catch (error) {
    return buildDeletionErrorResponse(error, 'batch-operation');
  }
}

module.exports = {
  // Business workflows
  deleteFileWithValidation,
  deleteFile,
  deleteFilesBatch,

  // Feature operations
  deleteFileFromStorage,
  getFileMetadataBeforeDeletion,

  // Feature utilities
  cleanFileName,
  validateDeletionRequest,
  buildDeletionSuccessResponse,
  buildBasicDeletionResponse,
  buildBatchDeletionResponse,
  buildDeletionErrorResponse,
};
