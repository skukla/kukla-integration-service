/**
 * Action for deleting files from storage
 * @module delete-file
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { deleteStoredFile } = require('../../src/files/workflows/file-management');
const { buildFileOperationErrorResponse } = require('../../src/htmx/operations/response-building');
const { generateFileDeletionResponse } = require('../../src/htmx/workflows/file-browser');

/**
 * Business logic for delete-file action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} HTMX response object
 */
async function deleteFileBusinessLogic(context) {
  const { config, extractedParams } = context;

  try {
    // Step 1: Delete file from storage
    await deleteStoredFile(extractedParams.fileName, config, extractedParams);

    // Step 2: Generate updated file browser HTML response for HTMX
    return await generateFileDeletionResponse(extractedParams.fileName, config, extractedParams);
  } catch (error) {
    // Step 3: Return error response with proper HTMX format
    return buildFileOperationErrorResponse(
      `Failed to delete file: ${error.message}`,
      'file-deletion',
      extractedParams.fileName
    );
  }
}

// Export the action with proper configuration
module.exports = createAction(deleteFileBusinessLogic, {
  actionName: 'delete-file',
  withTracing: false,
  withLogger: false,
  description: 'Delete file from storage',
});
