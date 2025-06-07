/**
 * HTML templates for the browse-files action
 * @module browse-files/templates
 */

const { buildRuntimeUrl } = require('../../../src/core/routing');

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
  return `
        <div class="actions-container">
            <div class="btn-group">
                <button type="button" 
                        class="btn btn-primary download-button"
                        data-file-name="${file.name}"
                        data-file-path="${file.fullPath}"
                        hx-get="#"
                        hx-trigger="click"
                        hx-swap="none"
                        hx-ext="loading-states"
                        hx-request='{"credentials": false}'
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
                        data-file-name="${file.name}"
                        data-file-path="${file.fullPath}"
                        data-loading-class="is-loading"
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
 * Generates HTML for storage provider indicator
 * @param {string} provider - Storage provider name ('s3' or 'app-builder')
 * @param {string} [bucketOrNamespace] - Bucket name for S3 or namespace for App Builder
 * @returns {string} HTML content
 */
function getStorageIndicatorHtml(provider, bucketOrNamespace = '') {
  const providerInfo = {
    s3: {
      name: 'Amazon S3',
      icon: '☁️',
      description: bucketOrNamespace ? `Bucket: ${bucketOrNamespace}` : 'Cloud Storage',
    },
    'app-builder': {
      name: 'Adobe I/O Files',
      icon: '📁',
      description: bucketOrNamespace ? `Namespace: ${bucketOrNamespace}` : 'Adobe Storage',
    },
  };

  const info = providerInfo[provider] || { name: 'Unknown', icon: '❓', description: '' };

  return `
    <div class="storage-indicator">
      <span class="storage-icon">${info.icon}</span>
      <div class="storage-details">
        <span class="storage-name">${info.name}</span>
        ${info.description ? `<span class="storage-description">${info.description}</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Generates HTML for a list of files with storage provider information
 * @param {Array<Object>} files - Array of file details
 * @param {Object} [storageInfo] - Storage provider information
 * @param {string} storageInfo.provider - Provider name
 * @param {string} [storageInfo.bucket] - S3 bucket name
 * @param {string} [storageInfo.namespace] - App Builder namespace
 * @returns {string} HTML content
 */
function getFileListHtml(files, storageInfo = null) {
  let content = '';

  // Add storage provider information if available
  if (storageInfo) {
    const bucketOrNamespace = storageInfo.bucket || storageInfo.namespace || '';
    content += getStorageIndicatorHtml(storageInfo.provider, bucketOrNamespace);
  }

  // Add file list or empty state
  if (!files || files.length === 0) {
    content += getEmptyStateHtml();
  } else {
    content += files.map((file) => getFileRowHtml(file)).join('');
  }

  return content;
}

/**
 * Generates HTML for the delete confirmation modal
 * @param {string} fileName - Name of the file to delete
 * @param {string} fullPath - Full path of the file
 * @returns {string} HTML content
 */
function getDeleteModalHtml(fileName, fullPath) {
  // Build runtime URL from environment configuration
  const runtimeUrl = buildRuntimeUrl('delete-file');
  const deleteUrl = `${runtimeUrl}?fileName=${encodeURIComponent(fullPath)}`;

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
                            class="btn btn-danger btn-outline delete-confirm-button"
                            data-loading-class="is-loading"
                            data-success-message="File deleted successfully"
                            data-file-name="${fileName}"
                            hx-delete="${deleteUrl}"
                            hx-target=".table-content"
                            hx-swap="innerHTML"
                            hx-trigger="click"
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
  getStorageIndicatorHtml,
  getDeleteModalHtml,
};
