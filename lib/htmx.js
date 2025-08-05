/**
 * Simplified HTMX Utilities for Adobe App Builder
 * Direct HTML generation without over-engineered abstractions
 */

const { formatFileSize } = require('./utils');

/**
 * Build download URL using runtime parameters
 * Centralized URL construction following frontend pattern
 */
function buildDownloadUrl(fileName, params) {
  const host = params.__OW_API_HOST || 'adobeioruntime.net';
  const namespace = params.__OW_NAMESPACE || params.AIO_runtime_namespace;

  if (!namespace) {
    throw new Error('Runtime namespace not available');
  }

  return `https://${host}/api/v1/web/${namespace}/kukla-integration-service/download-file?fileName=${encodeURIComponent(fileName)}`;
}

/**
 * Format timestamp - inline helper
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
 * @param {Object} params - Action parameters (for runtime URL)
 * @returns {string} Complete HTML for file browser
 */
function generateFileBrowserHTML(files, params = {}) {
  if (!files || files.length === 0) {
    return `
      <div class="table-row empty-state">
        <div class="table-cell empty-state-content">
          <h3>No exported files found</h3>
          <p>Use the export buttons above to create CSV files.</p>
        </div>
      </div>
    `;
  }

  const fileRows = files
    .map((file) => {
      const downloadUrl = buildDownloadUrl(file.name, params);

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
               onclick="handleDownloadWithSpinner(this, '${file.name}'); return true;">
              <span class="btn-label">Download</span>
            </a>
            <button type="button"
               class="btn btn-sm btn-danger delete-button"
               data-action="delete"
               data-file-name="${file.name}"
               data-file-path="${file.name}"
               title="Delete ${file.name}">
              <span class="btn-label">Delete</span>
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
  generateErrorHTML,
  createHTMLResponse,
};
