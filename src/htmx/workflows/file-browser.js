/**
 * HTMX File Browser Workflows
 *
 * High-level orchestration for file browser UI interactions.
 * Pure orchestration following DDD patterns - delegates to operations layer.
 */

const { listCsvFiles } = require('../../files/workflows/file-management');
const {
  generateCompleteFileBrowserHTML,
  generateDeleteModalHTML,
} = require('../operations/html-generation');
const {
  buildFileBrowserResponse,
  buildFileOperationSuccessResponse,
  buildFileOperationErrorResponse,
  buildModalResponse,
} = require('../operations/response-building');

/**
 * File browser listing workflow
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} HTMX response with file browser UI
 */
async function generateFileBrowserUI(config, params) {
  try {
    // Step 1: Fetch files list
    const files = await listCsvFiles(config, params);

    // Step 2: Generate complete file browser HTML
    const fileBrowserHTML = generateCompleteFileBrowserHTML(files, config);

    // Step 3: Build file browser response
    return buildFileBrowserResponse(fileBrowserHTML);
  } catch (error) {
    // Step 4: Build error response
    return buildFileOperationErrorResponse(
      'Failed to load file browser',
      'file-listing',
      error.message
    );
  }
}

/**
 * Generate HTMX response after file deletion
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {string} deletedFileName - Name of the deleted file
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} HTMX response with updated file browser
 */
async function generateFileDeletionResponse(deletedFileName, config, params) {
  try {
    // Step 1: Get updated file list (S3 provides strong consistency for all operations)
    const files = await listCsvFiles(config, params);

    // Step 2: Generate updated file browser HTML
    const fileBrowserHTML = generateCompleteFileBrowserHTML(files, config);

    // Step 3: Build file operation success response
    return buildFileOperationSuccessResponse(
      `${deletedFileName} deleted successfully`,
      fileBrowserHTML
    );
  } catch (error) {
    // Step 4: Build error response
    return buildFileOperationErrorResponse(
      'Failed to refresh file browser after deletion',
      'file-deletion-refresh',
      deletedFileName
    );
  }
}

/**
 * Delete confirmation modal workflow
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {string} fileName - Name of the file to delete
 * @returns {Object} HTMX response with delete modal
 */
function generateDeleteModal(fileName) {
  // Step 1: Generate delete modal HTML
  const modalHTML = generateDeleteModalHTML(
    fileName,
    `Are you sure you want to delete ${fileName}? This action cannot be undone.`
  );

  // Step 2: Build modal response
  return buildModalResponse(modalHTML, { show: true });
}

/**
 * Error response workflow
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {string} errorMessage - Error message to display
 * @param {string} [operation='operation'] - Operation that failed
 * @returns {Object} HTMX response with error notification
 */
function generateErrorResponse(errorMessage, operation = 'operation') {
  // Step 1: Build error response
  return buildFileOperationErrorResponse(errorMessage, operation);
}

module.exports = {
  generateFileBrowserUI,
  generateFileDeletionResponse,
  generateDeleteModal,
  generateErrorResponse,
};
