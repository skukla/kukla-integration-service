/**
 * File Deletion Action
 * Business capability: Delete files with comprehensive validation
 */

const { deleteFileWithValidation } = require('../../src/files/file-deletion');
const { generateCompleteFileBrowserUI } = require('../../src/htmx/file-browser-ui');
const { generateDeleteConfirmationModal } = require('../../src/htmx/modal-interactions');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * File deletion business logic
 * @purpose Execute file deletion workflow with comprehensive validation
 * @param {Object} context - Initialized action context with config and parameters
 * @returns {Promise<Object>} Deletion result with success confirmation
 * @usedBy Adobe App Builder frontend
 * @config storage.provider, files.protectedPatterns, storage.directory
 */
async function deleteFileBusinessLogic(context) {
  const { config, extractedParams } = context;

  // Step 1: Check if this is a confirmation request or file browser refresh
  if (!extractedParams.fileName) {
    return await generateCompleteFileBrowserUI(config, extractedParams);
  }

  // Step 2: Generate delete confirmation modal
  if (!extractedParams.confirmed) {
    return await generateDeleteConfirmationModal(extractedParams.fileName, config, extractedParams);
  }

  // Step 3: Execute validated file deletion
  const deletionResult = await deleteFileWithValidation(
    extractedParams.fileName,
    config,
    extractedParams
  );

  return deletionResult;
}

module.exports = createAction(deleteFileBusinessLogic, {
  actionName: 'delete-file',
  withLogger: false,
  description: 'Delete file from storage',
});
