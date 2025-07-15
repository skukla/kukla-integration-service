/**
 * Delete file action for removing files from storage
 * @module delete-file
 */

const { createAction } = require('../../src/core/action');
const { deleteStoredFile } = require('../../src/files/workflows/file-management');
const { generateFileDeletionResponse } = require('../../src/htmx/workflows/file-browser');

/**
 * Business logic for delete-file action
 * @param {Object} context - Initialized action context with logger
 * @returns {Promise<Object>} Action response
 */
async function deleteFileBusinessLogic(context) {
  const { core, config, extractedParams, webActionParams, logger } = context;

  // Merge raw web action params with processed extracted params
  const allActionParams = { ...webActionParams, ...extractedParams };

  // Validate required parameters
  const missingParams = core.checkMissingParams(allActionParams, ['fileName']);
  if (missingParams) {
    throw new Error(missingParams);
  }

  logger.info('Delete operation starting:', { fileName: allActionParams.fileName });

  // Use domain workflow to delete file
  await deleteStoredFile(allActionParams.fileName, config, extractedParams);

  logger.info('Delete operation completed:', { fileName: allActionParams.fileName });

  // Check if this is an HTMX request (expects HTML response)
  const isHtmxRequest =
    allActionParams['__ow_headers'] && allActionParams['__ow_headers']['hx-request'] === 'true';

  if (isHtmxRequest) {
    // Return HTMX response with updated file browser UI
    return await generateFileDeletionResponse(allActionParams.fileName, config, extractedParams);
  }

  // Return JSON response for API consumers
  return core.success({
    deletedFile: allActionParams.fileName,
    message: 'File deleted successfully',
  });
}

// Create action with framework - clean orchestrator pattern using domain workflows!
module.exports = createAction(deleteFileBusinessLogic, {
  actionName: 'delete-file',
  domains: ['files', 'htmx'],
  withTracing: false,
  withLogger: true,
  logLevel: 'info',
  description: 'Delete files from storage using domain workflows with HTMX support',
});
