/**
 * HTMX File Browser Workflows
 *
 * High-level orchestration for file browser UI interactions.
 * Consolidates the HTMX response generation and UI logic.
 */

const { formatFileSize } = require('../../core/utils');
const { listCsvFiles } = require('../../files/workflows/file-management');

/**
 * File browser listing workflow
 * Generates complete file browser UI with files list and controls.
 *
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @param {Object} trace - Trace context for performance monitoring
 * @returns {Promise<Object>} HTMX response with file browser UI
 */
async function generateFileBrowserUI(config, params) {
  // Fetch files list
  const files = await listCsvFiles(config, params);

  // Generate file list HTML
  const fileListHtml = generateFileListHTML(files);

  // Generate complete UI
  const html = `
    <div id="file-browser" class="file-browser">
      <div class="file-browser-header">
        <h3>Exported Files</h3>
        <button 
          hx-get="/api/v1/web/kukla-integration-service-default/browse-files"
          hx-target="#file-browser"
          hx-trigger="click"
          class="btn btn-refresh">
          Refresh
        </button>
      </div>
      ${fileListHtml}
    </div>
  `;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
    body: html,
  };
}

/**
 * Generates HTML for file list display
 * Creates the file list table with download and delete actions.
 *
 * @param {Array} files - Array of file objects
 * @returns {string} HTML string for file list
 */
function generateFileListHTML(files) {
  if (!files || files.length === 0) {
    return `
      <div class="file-list-empty">
        <p>No exported files found.</p>
        <p>Use the export buttons above to create CSV files.</p>
      </div>
    `;
  }

  const fileRows = files
    .map((file) => {
      const downloadUrl =
        file.downloadUrl ||
        `/api/v1/web/kukla-integration-service-default/download-file?fileName=${encodeURIComponent(file.name)}`;
      const fileSize = formatFileSize(file.size);
      const lastModified = file.lastModified
        ? new Date(file.lastModified).toLocaleString()
        : 'Unknown';

      return `
        <tr class="file-row">
          <td class="file-name">${file.name}</td>
          <td class="file-size">${fileSize}</td>
          <td class="file-date">${lastModified}</td>
          <td class="file-actions">
            <a href="${downloadUrl}" 
               class="btn btn-download btn-sm"
               download="${file.name}">
              Download
            </a>
            <button 
              hx-delete="/api/v1/web/kukla-integration-service-default/delete-file"
              hx-vals='{"fileName": "${file.name}"}'
              hx-target="#file-browser"
              hx-confirm="Are you sure you want to delete ${file.name}?"
              class="btn btn-delete btn-sm">
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="file-list">
      <table class="file-table">
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
 * File deletion success workflow
 * Generates updated file browser UI after successful deletion.
 *
 * @param {string} deletedFileName - Name of the deleted file
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} HTMX response with updated file browser
 */
async function generateFileDeletionResponse(deletedFileName, config, params) {
  // Get updated file list
  const updatedResponse = await generateFileBrowserUI(config, params);

  // Add success notification
  const notification = `
    <div class="notification notification-success" 
         hx-ext="auto-hide" 
         hx-auto-hide="3000">
      File "${deletedFileName}" deleted successfully
    </div>
  `;

  // Prepend notification to the response
  updatedResponse.body = notification + updatedResponse.body;

  return updatedResponse;
}

/**
 * Delete confirmation modal workflow
 * Generates delete confirmation modal for file operations.
 *
 * @param {string} fileName - Name of the file to delete
 * @returns {Object} HTMX response with delete modal
 */
function generateDeleteModal(fileName) {
  const html = `
    <div class="modal-overlay" onclick="this.remove()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <h3>Delete File</h3>
        <p>Are you sure you want to delete <strong>${fileName}</strong>?</p>
        <p>This action cannot be undone.</p>
        <div class="modal-actions">
          <button 
            hx-delete="/api/v1/web/kukla-integration-service-default/delete-file"
            hx-vals='{"fileName": "${fileName}"}'
            hx-target="#file-browser"
            hx-on::after-request="this.closest('.modal-overlay').remove()"
            class="btn btn-delete">
            Delete
          </button>
          <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
    body: html,
  };
}

/**
 * Error response workflow
 * Generates error notification for file operations.
 *
 * @param {string} errorMessage - Error message to display
 * @param {string} [operation='operation'] - Operation that failed
 * @returns {Object} HTMX response with error notification
 */
function generateErrorResponse(errorMessage, operation = 'operation') {
  const html = `
    <div class="notification notification-error" 
         hx-ext="auto-hide" 
         hx-auto-hide="5000">
      ${operation} failed: ${errorMessage}
    </div>
  `;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
    body: html,
  };
}

module.exports = {
  generateFileBrowserUI,
  generateFileListHTML,
  generateFileDeletionResponse,
  generateDeleteModal,
  generateErrorResponse,
};
