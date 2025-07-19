/**
 * HTMX File Browser UI
 * Complete file browser UI capability with HTML generation and HTMX response building
 */

// All dependencies at top - external vs internal obvious from paths
const { listCsvFiles } = require('../files/file-browser');
const { buildRuntimeUrl } = require('../shared/routing/runtime');

// Business Workflows

/**
 * Complete file browser UI workflow with error handling
 * @purpose Generate complete file browser interface with file listing and navigation
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

    // Step 2: Generate complete file browser HTML
    const fileBrowserHTML = generateFileBrowserHTML(files, config);

    // Step 3: Build HTMX response with file browser
    return buildFileBrowserResponse(fileBrowserHTML);
  } catch (error) {
    // Step 4: Handle errors with user-friendly response
    return generateFileBrowserErrorResponse('Failed to load file browser', error.message);
  }
}

/**
 * Refresh file browser after operations
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

    // Step 2: Generate updated file browser HTML
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
 * Generate empty file browser state
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
 * Generate complete file browser HTML with all components
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
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
      'HX-Trigger': 'file-browser-updated',
      ...options.headers,
    },
    body: htmlContent,
  };
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
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
      'HX-Trigger': JSON.stringify({
        'file-operation-success': { message: successMessage },
        'file-browser-updated': true,
      }),
    },
    body: updatedBrowserHTML,
  };
}

// Feature Utilities

/**
 * Generate HTML for empty file list state
 * @purpose Create user-friendly empty state when no files are available
 * @param {Object} config - Configuration object for messaging
 * @returns {string} HTML string for empty state
 * @usedBy generateFileBrowserHTML
 */
function generateEmptyFileListHTML(config) {
  const storageType = config.storage?.provider || 'storage';

  return `
    <div class="empty-state">
      <div class="empty-icon">📄</div>
      <h2>No exported files found</h2>
      <p>Use the export buttons above to create CSV files.</p>
      <p class="empty-details">Files will be stored in ${storageType} and appear here.</p>
    </div>
  `;
}

/**
 * Generate HTML for individual file row
 * @purpose Create HTML representation of a single file with actions
 * @param {Object} file - File object with metadata (name, size, lastModified, fullPath)
 * @param {Object} config - Configuration object with URL settings
 * @returns {string} HTML string for file row
 * @usedBy generateFileBrowserHTML
 */
function generateFileRowHTML(file, config) {
  // Use the full path for both download and delete to ensure consistency
  const fullPath = file.fullPath || file.name;
  const downloadUrl =
    buildRuntimeUrl('download-file', null, config) + `?fileName=${encodeURIComponent(fullPath)}`;

  return `
    <div class="table-row">
      <div class="table-cell">
        <span class="file-name">${escapeHtml(file.name)}</span>
      </div>
      <div class="table-cell">
        <span class="file-size">${file.size || 'Unknown'}</span>
      </div>
      <div class="table-cell">
        <span class="file-date">${file.lastModified || 'Unknown'}</span>
      </div>
      <div class="table-cell">
        <div class="table-actions">
          <a href="${downloadUrl}" 
             class="btn btn-sm btn-primary"
             download="${escapeHtml(file.name)}"
             title="Download ${escapeHtml(file.name)}">
            Download
          </a>
          <button class="btn btn-sm btn-danger btn-outline"
                  data-action="delete"
                  data-file-name="${escapeHtml(file.name)}"
                  data-file-path="${escapeHtml(fullPath)}"
                  title="Delete ${escapeHtml(file.name)}">
            Delete
          </button>
        </div>
      </div>
    </div>
  `;
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
  const errorHTML = `
    <div class="error-message htmx-error">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h4>File Browser Error</h4>
        <p>${escapeHtml(errorMessage)}</p>
        ${details ? `<p class="error-details">${escapeHtml(details)}</p>` : ''}
      </div>
    </div>
  `;

  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
    body: errorHTML,
  };
}

/**
 * Escape HTML characters for safe output
 * @purpose Prevent XSS by escaping HTML characters in user data
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 * @usedBy generateFileRowHTML, generateFileBrowserErrorResponse
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
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
  escapeHtml,
};
