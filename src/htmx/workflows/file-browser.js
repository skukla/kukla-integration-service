/**
 * HTMX File Browser Workflows
 *
 * File browser UI workflows and interactions
 */

const { listCsvFiles } = require('../../files/operations/storage-operations');
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

// === UI WORKFLOWS ===

/**
 * File browser listing workflow
 * Used by: browse-files action
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} HTMX response with file browser UI
 */
async function generateFileBrowserUI(config, params) {
  try {
    const files = await listCsvFiles(config, params);
    const fileBrowserHTML = generateCompleteFileBrowserHTML(files, config);
    return buildFileBrowserResponse(fileBrowserHTML);
  } catch (error) {
    return buildFileOperationErrorResponse(
      'Failed to load file browser',
      'file-listing',
      error.message
    );
  }
}

/**
 * Delete confirmation modal workflow
 * Used by: delete-file action (confirmation step)
 * @param {string} fileName - Name of file to delete
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} HTMX response with delete confirmation modal
 */
async function generateDeleteModal(fileName, config, params) {
  try {
    const files = await listCsvFiles(config, params);
    const modalHTML = generateDeleteModalHTML(fileName, files, config);
    return buildModalResponse(modalHTML);
  } catch (error) {
    return buildFileOperationErrorResponse(
      'Failed to generate delete confirmation',
      'modal-generation',
      error.message
    );
  }
}

/**
 * File deletion response workflow
 * Used by: delete-file action (completion step)
 * @param {string} fileName - Name of deleted file
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} HTMX response with updated file browser
 */
async function generateFileDeletionResponse(fileName, config, params) {
  try {
    const files = await listCsvFiles(config, params);
    const fileBrowserHTML = generateCompleteFileBrowserHTML(files, config);

    return buildFileOperationSuccessResponse(
      fileBrowserHTML,
      `File "${fileName}" deleted successfully`,
      'file-deletion'
    );
  } catch (error) {
    return buildFileOperationErrorResponse(
      'Failed to refresh file browser after deletion',
      'post-deletion-refresh',
      error.message
    );
  }
}

// === ERROR WORKFLOWS ===

/**
 * Generic error response workflow
 * @param {string} message - Error message to display
 * @param {string} operation - Operation that failed
 * @param {string} [details] - Additional error details
 * @returns {Object} HTMX error response
 */
async function generateErrorResponse(message, operation, details) {
  return buildFileOperationErrorResponse(message, operation, details);
}

module.exports = {
  // UI workflows
  generateFileBrowserUI,
  generateDeleteModal,
  generateFileDeletionResponse,

  // Error workflows
  generateErrorResponse,
};
