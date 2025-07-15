/**
 * Action for deleting files from storage
 * @module delete-file
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { deleteStoredFile } = require('../../src/files/workflows/file-management');

/**
 * Business logic for delete-file action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function deleteFileBusinessLogic(context) {
  const { core, config, extractedParams } = context;
  const steps = [];

  // Step 1: Input has been validated in the action factory
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Delete file from storage
  await deleteStoredFile(extractedParams.fileName, config, extractedParams);
  steps.push(
    core.formatStepMessage('delete-file', 'success', { fileName: extractedParams.fileName })
  );

  return {
    message: 'File deletion completed successfully',
    steps,
    deletedFile: extractedParams.fileName,
    success: true,
  };
}

// Export the action with proper configuration
module.exports = createAction(deleteFileBusinessLogic, {
  actionName: 'delete-file',
  withTracing: false,
  withLogger: false,
  description: 'Delete file from storage',
});
