/**
 * Download File Action - File download functionality
 * @module download-file
 * @description Handles secure file downloads from Adobe I/O Files storage using domain workflows
 */

// Use direct import from action factory operation - DDD compliant
const { createAction } = require('../../src/core/action/operations/action-factory');
const { downloadFileWorkflow } = require('../../src/files/workflows/file-management');

/**
 * Business logic for download-file action
 * @param {Object} context - Initialized action context with logger
 * @returns {Promise<Object>} Download response
 */
async function downloadFileBusinessLogic(context) {
  const { core, config, extractedParams, webActionParams, logger } = context;
  const steps = [];

  // Step 1: Validate input
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Merge raw web action params with processed extracted params for file operations
  const mergedParams = { ...webActionParams, ...extractedParams };

  try {
    // Validate required parameters
    const missingInputs = core.checkMissingParams(mergedParams, ['fileName']);
    if (missingInputs) {
      logger.error('Missing required inputs:', { missingInputs });
      throw new Error(missingInputs);
    }

    logger.info('Starting download request:', { fileName: mergedParams.fileName });

    // Use domain workflow for complete download process
    const downloadResponse = await downloadFileWorkflow({
      params: mergedParams,
      config,
      logger,
    });

    logger.info('Download completed successfully:', {
      fileName: mergedParams.fileName,
      statusCode: downloadResponse.statusCode,
    });

    steps.push(
      core.formatStepMessage('download-file', 'success', { size: downloadResponse.fileData.size })
    );

    return core.success(
      {
        fileData: downloadResponse.fileData,
        steps,
      },
      'File download completed successfully',
      {}
    );
  } catch (error) {
    logger.error('Error in download-file action:', error);

    // Return standardized error response
    return core.error(error, {});
  }
}

// Create action with framework
module.exports = createAction(downloadFileBusinessLogic, {
  actionName: 'download-file',
  domains: ['files'],
  withTracing: false,
  withLogger: true,
  logLevel: 'info',
  description: 'Download files from storage using domain workflows',
});
