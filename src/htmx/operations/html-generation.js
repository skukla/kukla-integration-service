/**
 * HTMX HTML Generation Operations
 *
 * Mid-level business logic for generating HTML components and UI elements.
 * Contains operations that build HTML strings for HTMX responses.
 */

const { buildRuntimeUrl } = require('../../core/routing/operations/runtime');
const { addPublicPrefix } = require('../../files/utils/paths');

/**
 * Generate empty file list HTML (matches browse-files structure)
 * Business operation that creates HTML for when no files are found.
 *
 * @returns {string} HTML string for empty state
 */
function generateEmptyFileListHTML() {
  return `
      <div class="empty-state">
        <h2>No exported files found</h2>
        <p>Use the export buttons above to create CSV files.</p>
      </div>
    `;
}

/**
 * Generate file row HTML (matches browse-files structure)
 * Business operation that creates HTML for a single file row.
 *
 * @param {Object} file - File object with metadata
 * @param {Object} config - Configuration object
 * @returns {string} HTML string for file row
 */
function generateFileRowHTML(file, config) {
  const fullPath = file.fullPath || addPublicPrefix(file.name);
  const downloadUrl =
    buildRuntimeUrl('download-file', null, config) + `?fileName=${encodeURIComponent(fullPath)}`;

  return `
        <div class="table-row">
          <div class="table-cell">
            <span class="file-name">${file.name}</span>
          </div>
          <div class="table-cell">
            <span class="file-size">${file.size}</span>
          </div>
          <div class="table-cell">
            <span class="file-date">${file.lastModified}</span>
          </div>
          <div class="table-cell">
            <div class="actions-container">
              <a href="${downloadUrl}" 
                 class="btn btn-sm btn-primary download-button"
                 hx-get="${downloadUrl}"
                 hx-swap="none"
                 data-loading-class="is-loading"
                 data-loading-states="true"
                 data-loading-text=""
                 download="${file.name}"
                 data-file-name="${file.name}"
                 data-file-path="${fullPath}"
                 title="Download ${file.name}">
                <span class="btn-text btn-label">Download</span>
              </a>
              <a href="#"
                 class="btn btn-sm btn-danger delete-button"
                 data-component="delete-button"
                 data-action="delete"
                 data-file-name="${file.name}"
                 data-file-path="${fullPath}"
                 data-loading-class="is-loading"
                 data-loading-states="true"
                 data-loading-text=""
                 title="Delete ${file.name}">
                <span class="btn-text btn-label">Delete</span>
              </a>
            </div>
          </div>
        </div>
      `;
}

/**
 * Generate file list HTML (matches browse-files structure exactly)
 * Business operation that creates file list matching the original browse-files format.
 *
 * @param {Array} files - Array of file objects
 * @param {Object} config - Configuration object
 * @returns {string} HTML string for file list
 */
function generateFileListHTML(files, config) {
  if (!files || files.length === 0) {
    return generateEmptyFileListHTML();
  }

  return files.map((file) => generateFileRowHTML(file, config)).join('');
}

/**
 * Generate complete file browser UI HTML
 * Business operation that creates the complete file browser interface.
 * Note: This returns only the table content for HTMX swapping, not the full browser.
 *
 * @param {Array} files - Array of file objects
 * @param {Object} config - Configuration object
 * @returns {string} Complete HTML string for file browser table content
 */
function generateCompleteFileBrowserHTML(files, config) {
  // For HTMX, we only need to return the table content that gets swapped
  return generateFileListHTML(files, config);
}

/**
 * Generate delete confirmation modal HTML
 * Business operation that creates modal for delete confirmation.
 *
 * @param {string} fileName - Name of file to delete
 * @param {string} message - Confirmation message
 * @returns {string} HTML string for delete modal
 */
function generateDeleteModalHTML(fileName, filePath) {
  return `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Confirm Deletion</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this file?</p>
          <p><strong>File:</strong> ${fileName}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary modal-close" 
                  hx-on="click: hideModal()">Cancel</button>
          <button class="btn btn-danger delete-confirm-button"
                  data-loading-class="is-loading"
                  data-loading-states="true"
                  data-loading-text=""
                  data-file-name="${fileName}"
                  hx-delete="?fileName=${encodeURIComponent(filePath)}"
                  hx-target=".table-content"
                  hx-swap="innerHTML"
                  hx-on="htmx:afterRequest: if(event.detail.successful) hideModal()">Delete</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate error message HTML
 * Business operation that creates error display HTML.
 *
 * @param {string} errorMessage - Error message to display
 * @param {string} [context] - Additional context information
 * @returns {string} HTML string for error display
 */
function generateErrorHTML(errorMessage, context = '') {
  return `
    <div class="error-message">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h4>Error</h4>
        <p>${errorMessage}</p>
        ${context ? `<p class="error-context">${context}</p>` : ''}
      </div>
    </div>
  `;
}

/**
 * Generate success message HTML
 * Business operation that creates success display HTML.
 *
 * @param {string} successMessage - Success message to display
 * @param {string} [details] - Additional details
 * @returns {string} HTML string for success display
 */
function generateSuccessHTML(successMessage, details = '') {
  return `
    <div class="success-message">
      <div class="success-icon">✅</div>
      <div class="success-content">
        <h4>Success</h4>
        <p>${successMessage}</p>
        ${details ? `<p class="success-details">${details}</p>` : ''}
      </div>
    </div>
  `;
}

module.exports = {
  generateEmptyFileListHTML,
  generateFileRowHTML,
  generateFileListHTML,
  generateCompleteFileBrowserHTML,
  generateDeleteModalHTML,
  generateErrorHTML,
  generateSuccessHTML,
};
