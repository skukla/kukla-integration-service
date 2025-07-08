/**
 * Browse files action for managing product export files
 * @module browse-files
 */

// Use action framework to eliminate duplication
const { routeRequest } = require('./lib/handlers');
const { createAction } = require('../../../src/core');
// Import action-specific helpers

/**
 * Business logic for browse-files action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Action response
 */
async function browseFilesBusinessLogic(context) {
  const { files, config, params, logger } = context;

  // Step 1: Initialize storage provider
  const storage = await files.initializeStorage(config, params);
  logger.info('Storage provider initialized:', { provider: storage.provider });

  // Step 2: Route request based on HTTP method and handle response
  const enhancedContext = { ...context, storage };
  return await routeRequest(enhancedContext);
}

/**
 * Enhanced error handler for browse-files operations
 */
function handleBrowseFilesError(error, context) {
  const { core, logger } = context;

  logger.error('Error in browse-files:', error);

  const errorObj = new Error(error.message);
  errorObj.status = error.status || 500;
  return core.error(errorObj);
}

/**
 * Business logic with error handling
 */
async function browseFilesWithErrorHandling(context) {
  try {
    return await browseFilesBusinessLogic(context);
  } catch (error) {
    return handleBrowseFilesError(error, context);
  }
}

// Create action with framework - clean orchestrator pattern!
module.exports = createAction(browseFilesWithErrorHandling, {
  actionName: 'browse-files',
  domains: ['files'],
  withTracing: false,
  withLogger: true,
  logLevel: 'info',
  description: 'Browse and manage product export files with HTMX interface',
});
