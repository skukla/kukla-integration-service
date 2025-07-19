/**
 * HTMX File Browser UI
 * Complete file browser UI capability using HTML template files for cleaner maintainable UI
 */

// All dependencies at top - template loader, file operations, and URL building
const { loadTemplateSync } = require('./shared/template-loader');
const { listCsvFiles } = require('../files/file-browser');
const { response } = require('../shared/http/responses');
const { createUrlBuilders } = require('../shared/routing/url-factory');

// Business Workflows

/**
 * Complete file browser UI workflow with error handling
 * @purpose Generate complete file browser interface using HTML templates
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} HTMX response with complete file browser UI
 * @throws {Error} When file listing fails or UI generation fails
 * @usedBy browse-files action
 * @config storage.provider, runtime.url, runtime.namespace
 */
async function generateCompleteFileBrowserUI(config, params) {
  try {
    // Step 1: Fetch file list from storage
    const files = await listCsvFiles(config, params);

    // Step 2: Generate complete file browser HTML using templates
    const fileBrowserHTML = generateFileBrowserHTML(files, config);

    // Step 3: Build HTMX response with file browser
    return buildFileBrowserResponse(fileBrowserHTML);
  } catch (error) {
    // Step 4: Handle errors with user-friendly response
    return generateFileBrowserErrorResponse('Failed to load file browser', error.message);
  }
}

/**
 * Refresh file browser after operations using templates
 * @purpose Regenerate file browser UI after file operations like delete, upload
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @param {string} [successMessage] - Optional success message to display
 * @returns {Promise<Object>} HTMX response with refreshed file browser
 * @throws {Error} When file listing refresh fails
 * @usedBy delete-file action completion, upload completion handlers
 * @config storage.provider, runtime.url, runtime.namespace
 */
async function refreshFileBrowserUI(config, params, successMessage = null) {
  try {
    // Step 1: Fetch updated file list
    const files = await listCsvFiles(config, params);

    // Step 2: Generate updated file browser HTML using templates
    const fileBrowserHTML = generateFileBrowserHTML(files, config);

    // Step 3: Build success response with optional message
    if (successMessage) {
      return buildFileOperationSuccessResponse(fileBrowserHTML, successMessage);
    }

    return buildFileBrowserResponse(fileBrowserHTML);
  } catch (error) {
    return generateFileBrowserErrorResponse('Failed to refresh file browser', error.message);
  }
}

/**
 * Generate empty file browser state using templates
 * @purpose Create file browser UI when no files are available
 * @param {Object} config - Configuration object with storage settings
 * @returns {Object} HTMX response with empty state UI
 * @usedBy generateCompleteFileBrowserUI when no files exist
 * @config storage.provider (for empty state messaging)
 */
async function generateEmptyFileBrowserUI(config) {
  const emptyStateHTML = generateEmptyFileListHTML(config);
  return buildFileBrowserResponse(emptyStateHTML);
}

// Feature Operations

/**
 * Generate complete file browser HTML using templates
 * @purpose Coordinate HTML generation for complete file browser interface
 * @param {Array} files - Array of file objects with metadata
 * @param {Object} config - Configuration object with URL settings
 * @returns {string} Complete HTML string for file browser
 * @usedBy generateCompleteFileBrowserUI, refreshFileBrowserUI
 */
function generateFileBrowserHTML(files, config) {
  if (!files || files.length === 0) {
    return generateEmptyFileListHTML(config);
  }

  return files.map((file) => generateFileRowHTML(file, config)).join('');
}

/**
 * Build HTMX response for file browser operations
 * @purpose Create standardized HTMX response for file browser interactions
 * @param {string} htmlContent - HTML content for file browser
 * @param {Object} [options] - Response options for HTMX headers
 * @returns {Object} Standardized HTMX file browser response
 * @usedBy generateCompleteFileBrowserUI, refreshFileBrowserUI
 */
function buildFileBrowserResponse(htmlContent, options = {}) {
  const customHeaders = {
    'HX-Trigger': 'file-browser-updated',
    ...options.headers,
  };

  return response.html(htmlContent, { headers: customHeaders });
}

/**
 * Build HTMX response for file operation success
 * @purpose Create standardized success response with file browser refresh
 * @param {string} updatedBrowserHTML - Updated file browser HTML
 * @param {string} successMessage - Success message to display
 * @returns {Object} HTMX success response with browser update
 * @usedBy refreshFileBrowserUI
 */
function buildFileOperationSuccessResponse(updatedBrowserHTML, successMessage) {
  const customHeaders = {
    'HX-Trigger': JSON.stringify({
      'file-operation-success': { message: successMessage },
      'file-browser-updated': true,
    }),
  };

  return response.html(updatedBrowserHTML, { headers: customHeaders });
}

// Feature Utilities

/**
 * Generate HTML for empty file list state using template
 * @purpose Create user-friendly empty state when no files are available
 * @param {Object} config - Configuration object for messaging
 * @returns {string} HTML string for empty state
 * @usedBy generateFileBrowserHTML
 */
function generateEmptyFileListHTML(config) {
  const variables = {
    storageType: config.storage.provider,
  };

  return loadTemplateSync('empty-file-list', variables);
}

/**
 * Generate HTML for individual file row using template
 * @purpose Create HTML representation of a single file with actions
 * @param {Object} file - File object with metadata (name, size, lastModified, fullPath)
 * @param {Object} config - Configuration object with URL settings
 * @returns {string} HTML string for file row
 * @usedBy generateFileBrowserHTML
 */
function generateFileRowHTML(file, config) {
  // Create pre-configured URL builders (config passed once)
  const { downloadUrl } = createUrlBuilders(config);

  // Use the full path for both download and delete to ensure consistency
  const fullPath = file.fullPath || file.name;
  const fileDownloadUrl = downloadUrl(fullPath);

  const variables = {
    fileName: file.name,
    fileSize: file.size || 'Unknown',
    fileDate: file.lastModified || 'Unknown',
    fullPath: fullPath,
    downloadUrl: fileDownloadUrl,
  };

  return loadTemplateSync('file-row', variables);
}

/**
 * Generate error response for file browser operations
 * @purpose Create standardized error response for file browser failures
 * @param {string} errorMessage - Primary error message to display
 * @param {string} [details] - Additional error details
 * @returns {Object} HTMX error response
 * @usedBy generateCompleteFileBrowserUI, refreshFileBrowserUI
 */
function generateFileBrowserErrorResponse(errorMessage, details = '') {
  const variables = {
    title: 'File Browser Error',
    message: errorMessage,
    details: details || null,
  };

  const errorHTML = loadTemplateSync('error-message', variables);
  return response.html(errorHTML, { statusCode: 500 });
}

module.exports = {
  // Business workflows (main exports that actions import)
  generateCompleteFileBrowserUI,
  refreshFileBrowserUI,
  generateEmptyFileBrowserUI,

  // Feature operations (coordination functions)
  generateFileBrowserHTML,
  buildFileBrowserResponse,
  buildFileOperationSuccessResponse,

  // Feature utilities (building blocks)
  generateEmptyFileListHTML,
  generateFileRowHTML,
  generateFileBrowserErrorResponse,
};
