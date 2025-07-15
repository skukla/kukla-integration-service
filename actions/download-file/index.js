/**
 * Action for downloading files from storage
 * @module download-file
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { downloadFileWorkflow } = require('../../src/files/workflows/file-management');

/**
 * Business logic for download-file action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function downloadFileBusinessLogic(context) {
  const { config, extractedParams } = context;

  // Extract filename from parameters
  const fileName = extractedParams.fileName;
  if (!fileName) {
    throw new Error('fileName parameter is required');
  }

  // Use the download workflow which handles all the response formatting
  return await downloadFileWorkflow(fileName, config, extractedParams);
}

// Export the action with proper configuration
module.exports = createAction(downloadFileBusinessLogic, {
  actionName: 'download-file',
  withTracing: false,
  withLogger: false,
  description: 'Download files from storage',
});
