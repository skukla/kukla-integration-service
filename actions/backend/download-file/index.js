/**
 * Download file action for retrieving files from storage
 * @module download-file
 * @description Handles secure file downloads from Adobe I/O Files storage
 */

// Use action framework to eliminate duplication
const { handleDownloadError } = require('./lib/error-handling');
const {
  validateAndPrepareDownload,
  initializeStorageAndGetFile,
  readFileAndCreateResponse,
} = require('./lib/operations');
const { createAction } = require('../../../src/core');
// Import action-specific helpers

/**
 * Business logic for download-file action
 * @param {Object} context - Initialized action context with logger
 * @returns {Promise<Object>} Download response
 */
async function downloadFileBusinessLogic(context) {
  const { files, core, config, params, originalParams, logger } = context;

  // Merge originalParams and params to handle query parameters properly
  const allParams = { ...originalParams, ...params };

  try {
    // Step 1: Validate parameters and prepare filename
    const cleanFileName = validateAndPrepareDownload(allParams, logger, core, files);

    // Step 2: Initialize storage and get file metadata
    const { storage, fileProps } = await initializeStorageAndGetFile(cleanFileName, {
      files,
      config,
      params,
      logger,
    });

    // Step 3: Read file content and create download response
    return await readFileAndCreateResponse(cleanFileName, storage, fileProps, logger, files);
  } catch (error) {
    // Handle errors with context-aware error responses
    return handleDownloadError(error, context);
  }
}

// Create action with framework - clean orchestrator pattern!
module.exports = createAction(downloadFileBusinessLogic, {
  actionName: 'download-file',
  domains: ['files'],
  withTracing: false,
  withLogger: true,
  logLevel: 'info',
  description: 'Download files from Adobe I/O Files storage',
});
