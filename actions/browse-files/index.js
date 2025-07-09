/**
 * Browse files action for managing product export files
 * @module browse-files
 */

const { createAction } = require('../../../src/core');
const {
  generateFileBrowserUI,
  generateDeleteModal,
  generateErrorResponse,
} = require('../../../src/htmx/workflows/file-browser');

/**
 * Business logic for browse-files action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Action response
 */
async function browseFilesBusinessLogic(context) {
  const { config, extractedParams, webActionParams, logger } = context;

  // Merge parameters for proper handling
  const allActionParams = { ...webActionParams, ...extractedParams };

  logger.info('Browse files request:', {
    method: allActionParams.__ow_method,
    modal: allActionParams.modal,
    fileName: allActionParams.fileName,
  });

  // Route based on HTTP method
  switch (allActionParams.__ow_method) {
    case 'get':
      // Handle modal requests
      if (allActionParams.modal === 'delete' && allActionParams.fileName) {
        // Use HTMX workflow for delete modal
        return generateDeleteModal(allActionParams.fileName);
      }

      // Generate file browser UI using domain workflow
      return await generateFileBrowserUI(config, extractedParams);

    default:
      logger.error('Method not allowed:', { method: allActionParams.__ow_method });
      return generateErrorResponse('Method not allowed', 'Request routing');
  }
}

/**
 * Business logic with error handling
 */
async function browseFilesWithErrorHandling(context) {
  try {
    return await browseFilesBusinessLogic(context);
  } catch (error) {
    const { logger } = context;
    logger.error('Error in browse-files:', error);
    return generateErrorResponse(error.message, 'File browsing');
  }
}

// Create action with framework - clean orchestrator pattern using domain workflows!
module.exports = createAction(browseFilesWithErrorHandling, {
  actionName: 'browse-files',
  domains: ['files', 'htmx'],
  withTracing: false,
  withLogger: true,
  logLevel: 'info',
  description: 'Browse and manage files with HTMX interface using domain workflows',
});
