/**
 * Simplified HTMX Utilities for Adobe App Builder
 * Direct HTML generation without over-engineered abstractions
 */

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
      <div class="file-browser">
        <div class="empty-state">
          <h2>No exported files found</h2>
          <p>Use the export buttons above to create CSV files.</p>
        </div>
      </div>
    `;
  }

  const fileRows = files
    .map((file) => {
      // Simple URL construction without over-engineered routing
      const downloadUrl = `/api/v1/web/kukla-integration-service/download-file?fileName=${encodeURIComponent(file.name)}`;
      const deleteUrl = `/api/v1/web/kukla-integration-service/delete-file?fileName=${encodeURIComponent(file.name)}`;

      return `
      <div class="table-row">
        <div class="table-cell">
          <span class="file-name">${file.name}</span>
        </div>
        <div class="table-cell">
          <span class="file-size">${file.size || 'Unknown'}</span>
        </div>
        <div class="table-cell">
          <span class="file-date">${file.lastModified || 'Unknown'}</span>
        </div>
        <div class="table-cell">
          <div class="actions-container">
            <a href="${downloadUrl}" 
               class="btn btn-sm btn-primary download-button"
               download="${file.name}"
               title="Download ${file.name}">
              <span class="btn-text btn-label">Download</span>
            </a>
            <button type="button"
               class="btn btn-sm btn-danger delete-button"
               hx-delete="${deleteUrl}"
               hx-confirm="Are you sure you want to delete ${file.name}?"
               hx-target="#file-browser"
               hx-swap="outerHTML"
               title="Delete ${file.name}">
              <span class="btn-text btn-label">Delete</span>
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  return `
    <div id="file-browser" class="file-browser">
      <div class="table-container">
        <div class="table-header">
          <div class="table-row header-row">
            <div class="table-cell">Name</div>
            <div class="table-cell">Size</div>
            <div class="table-cell">Date</div>
            <div class="table-cell">Actions</div>
          </div>
        </div>
        <div class="table-body">
          ${fileRows}
        </div>
      </div>
    </div>
  `;
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
function generateFileDeletionResponse(deletedFileName, remainingFiles, config) {
  const successMessage = `
    <div class="success-message">
      File "${deletedFileName}" deleted successfully.
    </div>
  `;

  const fileBrowserHTML = generateFileBrowserHTML(remainingFiles, config);

  return successMessage + fileBrowserHTML;
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
