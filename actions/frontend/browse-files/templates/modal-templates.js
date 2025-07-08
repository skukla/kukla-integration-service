/**
 * Modal templates for browse-files action
 * @module templates/modal-templates
 */

const { loadConfig } = require('../../../../config');
const { buildRuntimeUrl } = require('../../../../src/core/routing');

/**
 * Generates HTML for the delete confirmation modal
 * @param {string} fileName - Name of the file to delete
 * @param {string} fullPath - Full path of the file
 * @param {Object} [params] - Parameters for URL building
 * @returns {string} HTML content
 */
function getDeleteModalHtml(fileName, fullPath, params = {}) {
  // Build runtime URL from environment configuration
  const config = loadConfig(params);
  const runtimeUrl = buildRuntimeUrl('delete-file', null, config);
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
  getDeleteModalHtml,
};
