/**
 * Delete File Action - File deletion functionality
 * @module delete-file
 */

// Use direct import from action factory operation - DDD compliant
const { createAction } = require('../../src/core/action/operations/action-factory');

/**
 * Business logic for delete-file action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function deleteFileBusinessLogic(context) {
  const { files, core, config, extractedParams } = context;
  const steps = [];

  // Step 1: Input has been validated in the action factory
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Delete file using files domain
  const deleteResult = await files.deleteFile(extractedParams, config);
  steps.push(core.formatStepMessage('delete-file', 'success', { file: deleteResult.fileName }));

  return core.success(
    {
      deleteResult,
      steps,
    },
    'File deletion completed successfully',
    {}
  );
}

// Create action with framework - all boilerplate eliminated!
module.exports = createAction(deleteFileBusinessLogic, {
  actionName: 'delete-file',
  domains: ['files'],
  withTracing: false,
  withLogger: false,
  description: 'Delete file from storage',
});
