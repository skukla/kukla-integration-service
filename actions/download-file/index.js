/**
 * File Download Action
 * Business capability: Download files with content retrieval and proper response headers
 */

const { downloadFileWithResponse } = require('../../src/files/file-download');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * Download file with response handling
 * @purpose Orchestrate file download with proper content type detection and response building
 * @param {Object} context - Action execution context with config and extracted parameters
 * @returns {Promise<Object>} File download response with proper headers and content
 * @usedBy download-file action via createAction framework
 */
async function downloadFileBusinessLogic(context) {
  const { config, extractedParams, rawParams } = context;

  // Step 1: Validate required parameters
  const fileName = extractedParams.fileName;
  if (!fileName) {
    throw new Error('fileName parameter is required');
  }

  // Step 2: Execute complete download workflow with rawParams for runtime context
  return await downloadFileWithResponse(fileName, config, rawParams);
}

module.exports = createAction(downloadFileBusinessLogic, {
  actionName: 'download-file',
  withLogger: false,
  description: 'Download files from storage',
});
