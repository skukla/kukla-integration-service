/**
 * HTML templates for the browse-files action
 * @module browse-files/templates
 */

const { loadConfig } = require('../../../config');

// Get the runtime configuration
const config = loadConfig();
const { baseUrl } = config.url.runtime;

/**
 * Build a download URL for a file
 * @param {string} fileName - Name of the file
 * @returns {string} Download URL
 */
function buildDownloadUrl(fileName) {
  // For staging/production, use the baseUrl from config
  // For development, this will be localhost:9080
  return `${baseUrl}/api/v1/web/kukla-integration-service/download-file?fileName=${encodeURIComponent(fileName)}`;
}

/**
 * Generates HTML for an empty state when no files are found
 * @returns {string} HTML content
 */
function getEmptyStateHtml() {
  return `
        <div class="empty-state">
            <h2>No Files Found</h2>
            <p>There are no exported files to display.</p>
        </div>
    `;
}

/**
 * Generates HTML for a file row's action buttons
 * @param {Object} file - File details object
 * @returns {string} HTML content
 */
function getActionButtonsHtml(file) {
  const modalUrl = `${baseUrl}/browse-files?modal=delete&fileName=${encodeURIComponent(file.name)}&fullPath=${encodeURIComponent(file.fullPath)}`;
  const downloadUrl = buildDownloadUrl(file.fullPath);

  return `
        <div class="actions-container">
            <div class="btn-group">
                <button type="button" 
                        class="btn btn-primary download-button"
                        data-file-name="${file.name}"
                        hx-get="${downloadUrl}"
                        hx-trigger="click"
                        hx-swap="none"
                        hx-ext="loading-states"
                        data-loading-states
                        data-loading-class="is-loading"
                        data-loading-delay="100"
                        data-loading-target="this"
                        tabindex="-1"
                        aria-label="Download ${file.name}">
                    <span class="btn-label">Download</span>
                </button>
                <button type="button"
                        class="btn btn-danger btn-outline"
                        data-action="delete"
                        data-loading-class="is-loading"
                        data-modal-url="${modalUrl}"
                        data-file-name="${file.name}"
                        tabindex="-1"
                        aria-label="Delete ${file.name}">
                    <span class="btn-label">Delete</span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Generates HTML for a single file row
 * @param {Object} file - File details object
 * @returns {string} HTML content
 */
function getFileRowHtml(file) {
  return `
        <div class="table-row" role="row" data-file-name="${file.name}">
            <div class="table-cell" role="cell">
                <span>${file.name}</span>
            </div>
            <div class="table-cell" role="cell">
                <span>${file.size}</span>
            </div>
            <div class="table-cell" role="cell">
                <span>${file.lastModified}</span>
            </div>
            <div class="table-cell" role="cell">
                ${getActionButtonsHtml(file)}
            </div>
        </div>
    `;
}

/**
 * Generates HTML for a list of files
 * @param {Array<Object>} files - Array of file details
 * @returns {string} HTML content
 */
function getFileListHtml(files) {
  if (!files || files.length === 0) {
    return getEmptyStateHtml();
  }
  return files.map((file) => getFileRowHtml(file)).join('');
}

/**
 * Generates HTML for the delete confirmation modal
 * @param {string} fileName - Name of the file to delete
 * @param {string} fullPath - Full path of the file
 * @returns {string} HTML content
 */
function getDeleteModalHtml(fileName, fullPath) {
  const deleteUrl = `${baseUrl}/delete-file?fileName=${encodeURIComponent(fullPath)}`;

  return `
        <div class="modal-content">
            <h2>Delete File</h2>
            <div class="modal-body">
                <p>Are you sure you want to delete "${fileName}"?</p>
                <p class="modal-warning">This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <div class="btn-group">
                    <button type="button"
                            class="btn btn-secondary modal-close"
                            aria-label="Cancel deletion">
                        <span class="btn-label">Cancel</span>
                    </button>
                    <button type="button"
                            class="btn btn-danger btn-outline"
                            data-loading-class="is-loading"
                            data-delete-url="${deleteUrl}"
                            data-file-name="${fileName}"
                            aria-label="Confirm deletion of ${fileName}">
                        <span class="btn-label">Delete</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

module.exports = {
  getEmptyStateHtml,
  getActionButtonsHtml,
  getFileRowHtml,
  getFileListHtml,
  getDeleteModalHtml,
};
