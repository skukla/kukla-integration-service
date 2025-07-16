/**
 * Action for browsing and listing CSV files in storage
 * @module browse-files
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { getCsvFiles } = require('../../src/files/workflows/file-management');
const { generateCompleteFileBrowserHTML } = require('../../src/htmx/operations/html-generation');

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

  // Step 3: Generate HTML using the HTML generation operations
  const html = generateCompleteFileBrowserHTML(fileList, config);

  // Return HTML response for HTMX
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
    body: html,
  };
}

// Export the action with proper configuration
module.exports = createAction(browseFilesBusinessLogic, {
  actionName: 'browse-files',
  withTracing: false,
  withLogger: false,
  description: 'Browse files in storage',
});
