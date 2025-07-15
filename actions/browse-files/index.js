/**
 * Action for browsing and listing CSV files in storage
 * @module browse-files
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { getCsvFiles } = require('../../src/files/workflows/file-management');

/**
 * Business logic for browse-files action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function browseFilesBusinessLogic(context) {
  const { core, config, extractedParams } = context;
  const steps = [];

  // Step 1: Input has been validated in the action factory
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Get list of CSV files from storage
  const fileList = await getCsvFiles(config, extractedParams);
  steps.push(core.formatStepMessage('browse-files', 'success', { count: fileList.length }));

  return {
    message: 'File browsing completed successfully',
    steps,
    files: fileList,
    count: fileList.length,
  };
}

// Export the action with proper configuration
module.exports = createAction(browseFilesBusinessLogic, {
  actionName: 'browse-files',
  withTracing: false,
  withLogger: false,
  description: 'Browse files in storage',
});
