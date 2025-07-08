/**
 * Delete file action for removing files from storage
 * @module delete-file
 */

// Use action framework to eliminate duplication
const { createAction } = require('../../../src/core');

/**
 * Business logic for delete-file action
 * @param {Object} context - Initialized action context with logger
 * @returns {Promise<Object>} Action response
 */
async function deleteFileBusinessLogic(context) {
  const { files, core, config, params, originalParams, logger } = context;
  const steps = [];

  // Merge parameters to handle query parameters properly
  const allParams = { ...originalParams, ...params };

  // Step 1: Validate required parameters
  const missingParams = core.checkMissingParams(allParams, ['fileName']);
  if (missingParams) {
    throw new Error(missingParams);
  }
  steps.push(core.formatStepMessage('validate-parameters', 'success'));

  // Step 2: Delete file from storage
  const cleanFileName = files.extractCleanFilename(allParams.fileName);
  logger.info('Delete operation starting:', {
    original: allParams.fileName,
    clean: cleanFileName,
  });

  const storage = await files.initializeStorage(config, params);
  await files.deleteFile(storage, cleanFileName);
  steps.push(core.formatStepMessage('delete-file', 'success', { fileName: cleanFileName }));

  // Step 3: Get updated file list using browse-files action
  const { main: browseFilesMain } = require('../../frontend/browse-files/index');
  const fileListResponse = await browseFilesMain({
    ...allParams,
    __ow_method: 'get',
    modal: null, // Ensure we don't return modal content
  });
  steps.push(core.formatStepMessage('refresh-file-list', 'success'));

  // Return success response with steps (following get-products pattern)
  return core.success(
    {
      steps,
      fileList: fileListResponse,
      deletedFile: cleanFileName,
    },
    'File deleted successfully',
    {}
  );
}

// Create action with framework - clean orchestrator pattern!
module.exports = createAction(deleteFileBusinessLogic, {
  actionName: 'delete-file',
  domains: ['files'],
  withTracing: false,
  withLogger: true,
  logLevel: 'info',
  description: 'Delete files from storage and return updated file list',
});
