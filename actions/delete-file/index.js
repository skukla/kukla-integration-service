/**
 * Action for deleting files from storage
 * @module delete-file
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { deleteStoredFile } = require('../../src/files/operations/storage-operations');
const { generateFileDeletionResponse } = require('../../src/htmx/workflows/file-browser');

/**
 * Business logic for delete-file action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} HTMX response object
 */
async function deleteFileBusinessLogic(context) {
  const { config, extractedParams } = context;

  // Validate fileName parameter
  if (!extractedParams.fileName) {
    // If no fileName, return current file list
    const { generateFileBrowserUI } = require('../../src/htmx/workflows/file-browser');
    return await generateFileBrowserUI(config, extractedParams);
  }

  // Step 1: Delete file from storage
  await deleteStoredFile(extractedParams.fileName, config, extractedParams);

  // Step 2: Generate updated file browser HTML response for HTMX
  return await generateFileDeletionResponse(extractedParams.fileName, config, extractedParams);
}

// Export the action with proper configuration
module.exports = createAction(deleteFileBusinessLogic, {
  actionName: 'delete-file',
  withLogger: false,
  description: 'Delete file from storage',
});
