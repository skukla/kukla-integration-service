/**
 * Download file action for retrieving files from storage
 * @module download-file
 * @description Handles secure file downloads from Adobe I/O Files storage using domain workflows
 */

const { createAction } = require('../../src/core');
const { downloadFileWorkflow } = require('../../src/files/workflows/file-management');

/**
 * Business logic for download-file action
 * @param {Object} context - Initialized action context with logger
 * @returns {Promise<Object>} Download response
 */
async function downloadFileBusinessLogic(context) {
  const { core, config, extractedParams, webActionParams, logger } = context;

  // Merge raw web action params with processed extracted params for file operations
  const allActionParams = { ...webActionParams, ...extractedParams };

  try {
    // Validate required parameters
    const missingInputs = core.checkMissingParams(allActionParams, ['fileName']);
    if (missingInputs) {
      logger.error('Missing required inputs:', { missingInputs });
      throw new Error(missingInputs);
    }

    logger.info('Starting download request:', { fileName: allActionParams.fileName });

    // Use domain workflow for complete download process
    const downloadResponse = await downloadFileWorkflow(
      allActionParams.fileName,
      config,
      extractedParams
    );

    logger.info('Download completed successfully:', {
      fileName: allActionParams.fileName,
      statusCode: downloadResponse.statusCode,
    });

    return downloadResponse;
  } catch (error) {
    logger.error('Error in download-file action:', error);

    // Return standardized error response
    return core.response.error(error, {});
  }
}

// Create action with framework - clean orchestrator pattern using domain workflows!
module.exports = createAction(downloadFileBusinessLogic, {
  actionName: 'download-file',
  domains: ['files'],
  withTracing: false,
  withLogger: true,
  logLevel: 'info',
  description: 'Download files from storage using domain workflows',
});
