/**
 * Simplified HTMX Utilities for Adobe App Builder
 * Direct HTML generation without over-engineered abstractions
 */

const { formatFileSize } = require('./utils');

/**
 * Format timestamp to human-readable format without timezone
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date/time
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  try {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Generate file browser HTML
 * Simplified version without complex routing and response builders
 *
 * @param {Array} files - Array of file objects
 * @returns {string} Complete HTML for file browser
 */
function generateFileBrowserHTML(files) {
  if (!files || files.length === 0) {
    return `
      <div class="table-row empty-state">
        <div class="table-cell" colspan="4">
          <div style="text-align: center; padding: 2rem;">
            <h3>No exported files found</h3>
            <p>Use the export buttons above to create CSV files.</p>
          </div>
        </div>
      </div>
    `;
  }

  const fileRows = files
    .map((file) => {
      // Simple URL construction without over-engineered routing
      const downloadUrl = `/api/v1/web/kukla-integration-service/download-file?fileName=${encodeURIComponent(file.name)}`;

      return `
      <div class="table-row">
        <div class="table-cell">
          <span class="file-name">${file.name}</span>
        </div>
        <div class="table-cell">
          <span class="file-size">${file.size ? formatFileSize(file.size) : 'Unknown'}</span>
        </div>
        <div class="table-cell">
          <span class="file-date">${formatTimestamp(file.lastModified)}</span>
        </div>
        <div class="table-cell">
          <div class="actions-container">
            <a href="${downloadUrl}" 
               class="btn btn-sm btn-primary download-button"
               download="${file.name}"
               title="Download ${file.name}"
               onclick="setTimeout(() => showDownloadNotification('${file.name}'), 500)">
              <span class="btn-text btn-label">Download</span>
            </a>
            <button type="button"
               class="btn btn-sm btn-danger delete-button"
               data-component="delete-button"
               data-action="delete"
               data-file-name="${file.name}"
               data-file-path="${file.name}"
               title="Delete ${file.name}">
              <span class="btn-text btn-label">Delete</span>
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  // Return only the file rows for HTMX insertion into .table-content
  return fileRows;
}

/**
 * Generate file deletion response HTML
 * Returns updated file browser after deletion
 *
 * @param {string} deletedFileName - Name of deleted file
 * @param {Array} remainingFiles - Remaining files after deletion
 * @param {Object} config - Configuration object
 * @returns {string} Updated file browser HTML
 */
function generateFileDeletionResponse(deletedFileName, remainingFiles) {
  // For delete response, we need to return the complete file browser structure
  // since we're replacing the entire .file-browser element
  const fileRows = generateFileBrowserHTML(remainingFiles);

  return `
    <div class="file-browser">
      <div class="table-wrapper">
        <div class="table">
          <!-- Header Row -->
          <div class="table-row header">
            <div class="table-header">File Name</div>
            <div class="table-header">Size</div>
            <div class="table-header">Last Modified</div>
            <div class="table-header">Actions</div>
          </div>
          <!-- Content Area -->
          <div class="table-content" data-component="file-list">
            ${fileRows}
          </div>
        </div>
      </div>
      <div class="success-message" style="margin-top: 1rem; padding: 0.75rem; background: #d4edda; color: #155724; border-radius: 4px;">
        File "${deletedFileName}" deleted successfully.
      </div>
    </div>
  `;
}

/**
 * Generate error response HTML for HTMX
 *
 * @param {string} errorMessage - Error message to display
 * @param {string} operation - Operation that failed
 * @returns {string} Error HTML
 */
function generateErrorHTML(errorMessage, operation) {
  return `
    <div class="error-message htmx-error">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h4>Error</h4>
        <p>${errorMessage}</p>
        <small>Operation: ${operation}</small>
      </div>
    </div>
  `;
}

/**
 * Create HTMX HTML response
 * Simple response builder without over-engineered abstractions
 *
 * @param {string} htmlContent - HTML content
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Response object
 */
function createHTMLResponse(htmlContent, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
    body: htmlContent,
  };
}

module.exports = {
  generateFileBrowserHTML,
  generateFileDeletionResponse,
  generateErrorHTML,
  createHTMLResponse,
};
