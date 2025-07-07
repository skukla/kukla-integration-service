/**
 * File-related templates for browse-files action
 * @module templates/file-templates
 */

const uiComponents = require('./ui-components');

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
                ${uiComponents.getActionButtonsHtml(file)}
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
    content += uiComponents.getStorageIndicatorHtml(storageInfo.provider, bucketOrNamespace);
  }

  // Add file list or empty state
  if (!files || files.length === 0) {
    content += uiComponents.getEmptyStateHtml();
  } else {
    content += files.map((file) => getFileRowHtml(file)).join('');
  }

  return content;
}

module.exports = {
  getFileRowHtml,
  getFileListHtml,
};
