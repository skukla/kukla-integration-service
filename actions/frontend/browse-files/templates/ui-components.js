/**
 * UI component templates for browse-files action
 * @module templates/ui-components
 */

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

module.exports = {
  getEmptyStateHtml,
  getActionButtonsHtml,
  getStorageIndicatorHtml,
};
