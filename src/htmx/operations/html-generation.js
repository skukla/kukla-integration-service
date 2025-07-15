/**
 * HTMX HTML Generation Operations
 *
 * Mid-level business logic for generating HTML components and UI elements.
 * Contains operations that build HTML strings for HTMX responses.
 */

const { formatFileSize } = require('../../core/utils/operations/formatting');

/**
 * Generate file browser header HTML
 * Business operation that creates the file browser header with refresh button.
 *
 * @param {Object} config - Configuration object
 * @returns {string} HTML string for file browser header
 */
function generateFileBrowserHeader(config) {
  const refreshUrl = `${config.runtime.url}/api/v1/web/${config.runtime.namespace}/browse-files`;

  return `
    <div class="file-browser-header">
      <h3>Exported Files</h3>
      <button 
        hx-get="${refreshUrl}"
        hx-target="#file-browser"
        hx-trigger="click"
        class="btn btn-refresh">
        Refresh
      </button>
    </div>
  `;
}

/**
 * Generate empty file list HTML
 * Business operation that creates HTML for when no files are found.
 *
 * @returns {string} HTML string for empty state
 */
function generateEmptyFileListHTML() {
  return `
    <div class="file-list-empty">
      <p>No exported files found.</p>
      <p>Use the export buttons above to create CSV files.</p>
    </div>
  `;
}

/**
 * Generate file row HTML
 * Business operation that creates HTML for a single file row.
 *
 * @param {Object} file - File object with metadata
 * @param {Object} config - Configuration object
 * @returns {string} HTML string for file row
 */
function generateFileRowHTML(file, config) {
  const downloadUrl =
    file.downloadUrl ||
    `${config.runtime.url}/api/v1/web/${config.runtime.namespace}/download-file?fileName=${encodeURIComponent(file.name)}`;
  const deleteUrl = `${config.runtime.url}/api/v1/web/${config.runtime.namespace}/delete-file`;

  const fileSize = formatFileSize(file.size);
  const lastModified = file.lastModified ? new Date(file.lastModified).toLocaleString() : 'Unknown';

  return `
    <tr>
      <td class="file-name">
        <span class="file-icon">📄</span>
        ${file.name}
      </td>
      <td class="file-size">${fileSize}</td>
      <td class="file-date">${lastModified}</td>
      <td class="file-actions">
        <a href="${downloadUrl}" download="${file.name}" class="btn btn-download">
          Download
        </a>
        <button 
          class="btn btn-delete"
          hx-delete="${deleteUrl}"
          hx-vals='{"fileName": "${file.name}"}'
          hx-target="#file-browser"
          hx-confirm="Are you sure you want to delete ${file.name}?"
          hx-indicator="#loading">
          Delete
        </button>
      </td>
    </tr>
  `;
}

/**
 * Generate file list table HTML
 * Business operation that creates complete file list table with headers and rows.
 *
 * @param {Array} files - Array of file objects
 * @param {Object} config - Configuration object
 * @returns {string} HTML string for file list table
 */
function generateFileListTableHTML(files, config) {
  if (!files || files.length === 0) {
    return generateEmptyFileListHTML();
  }

  const fileRows = files.map((file) => generateFileRowHTML(file, config)).join('');

  return `
    <div class="file-list">
      <table class="files-table">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Size</th>
            <th>Last Modified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${fileRows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate complete file browser UI HTML
 * Business operation that creates the complete file browser interface.
 *
 * @param {Array} files - Array of file objects
 * @param {Object} config - Configuration object
 * @returns {string} Complete HTML string for file browser
 */
function generateCompleteFileBrowserHTML(files, config) {
  const headerHTML = generateFileBrowserHeader(config);
  const fileListHTML = generateFileListTableHTML(files, config);

  return `
    <div id="file-browser" class="file-browser">
      ${headerHTML}
      ${fileListHTML}
    </div>
  `;
}

/**
 * Generate delete confirmation modal HTML
 * Business operation that creates modal for delete confirmation.
 *
 * @param {string} fileName - Name of file to delete
 * @param {string} message - Confirmation message
 * @returns {string} HTML string for delete modal
 */
function generateDeleteModalHTML(fileName, message) {
  return `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Confirm Deletion</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
          <p><strong>File:</strong> ${fileName}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-cancel" onclick="closeModal()">Cancel</button>
          <button class="btn btn-danger" onclick="confirmDelete()">Delete</button>
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
  generateFileBrowserHeader,
  generateEmptyFileListHTML,
  generateFileRowHTML,
  generateFileListTableHTML,
  generateCompleteFileBrowserHTML,
  generateDeleteModalHTML,
  generateErrorHTML,
  generateSuccessHTML,
};
