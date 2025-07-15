/**
 * Browse Files Action - File system exploration for Adobe I/O Files
 * @module browse-files
 */

// Use direct import from action factory operation - DDD compliant
const { createAction } = require('../../src/core/action/operations/action-factory');

/**
 * Business logic for browse-files action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function browseFilesBusinessLogic(context) {
  const { files, core, config, extractedParams } = context;
  const steps = [];

  // Step 1: Validate input
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Browse files using files domain
  const fileList = await files.browseFiles(extractedParams, config);
  steps.push(core.formatStepMessage('browse-files', 'success', { count: fileList.length }));

  return core.success(
    {
      files: fileList,
      steps,
    },
    'File browsing completed successfully',
    {}
  );
}

// Create action with framework - all boilerplate eliminated!
module.exports = createAction(browseFilesBusinessLogic, {
  actionName: 'browse-files',
  domains: ['files'],
  withTracing: false,
  withLogger: false,
  description: 'Browse files in Adobe I/O Files storage',
});
