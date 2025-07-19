/**
 * File Download Action
 * Business capability: Download files with content retrieval and proper response headers
 */

const { downloadFileWithResponse } = require('../../src/files/file-download');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * File download business logic
 * @purpose Execute file download workflow with content retrieval and response building
 * @param {Object} context - Initialized action context with config and parameters
 * @returns {Promise<Object>} Complete download response with file content and headers
 * @usedBy Adobe App Builder frontend, external download requests
 * @config storage.provider, storage.directory, files.mimeTypes
 */
async function downloadFileBusinessLogic(context) {
  const { config, extractedParams } = context;

  // Step 1: Validate required parameters
  const fileName = extractedParams.fileName;
  if (!fileName) {
    throw new Error('fileName parameter is required');
  }

  // Step 2: Execute complete download workflow
  return await downloadFileWithResponse(fileName, config, extractedParams);
}

module.exports = createAction(downloadFileBusinessLogic, {
  actionName: 'download-file',
  withLogger: false,
  description: 'Download files from storage',
});
