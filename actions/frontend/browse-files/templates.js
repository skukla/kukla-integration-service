/**
 * HTML templates for the browse-files action
 * @module browse-files/templates
 */

/**
 * Generates HTML for an empty state when no files are found
 * @returns {string} HTML for empty state
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
 * Generates HTML for the delete confirmation modal
 * @param {string} fileName - Name of the file to delete
 * @param {string} fullPath - Full path of the file
 * @returns {string} HTML for the modal
 */
function getDeleteModalHtml(fileName, fullPath) {
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
                            class="btn btn-secondary"
                            hx-on:click="hideModal()"
                            aria-label="Cancel deletion">
                        <span class="btn-label">Cancel</span>
                    </button>
                    <button type="button"
                            class="btn btn-danger btn-outline"
                            hx-delete="/api/v1/web/kukla-integration-service/delete-file?fileName=${encodeURIComponent(fullPath)}"
                            hx-target="closest .table-row"
                            hx-swap="outerHTML swap:1s"
                            aria-label="Confirm deletion of ${fileName}">
                        <span class="btn-label">Delete</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generates HTML for action buttons in a file row
 * @param {Object} file - File details object
 * @returns {string} HTML for action buttons
 */
function getActionButtonsHtml(file) {
    return `
        <div class="actions-container">
            <div class="btn-group">
                <button type="button" 
                        class="btn btn-primary"
                        hx-get="/api/v1/web/kukla-integration-service/download-file?fileName=${encodeURIComponent(file.fullPath)}"
                        hx-swap="none"
                        onclick="window.showNotification('Download started for ' + '${file.name}', 'info')"
                        aria-label="Download ${file.name}">
                    <span class="btn-label">Download</span>
                </button>
                <button type="button"
                        class="btn btn-danger btn-outline"
                        hx-get="/api/v1/web/kukla-integration-service/browse-files?modal=delete&fileName=${encodeURIComponent(file.name)}&fullPath=${encodeURIComponent(file.fullPath)}"
                        hx-target="#modal-container"
                        hx-swap="innerHTML"
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
 * @returns {string} HTML for the file row
 */
function getFileRowHtml(file) {
    return `
        <div class="table-row" role="row">
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
 * @returns {string} HTML for the file list
 */
function getFileListHtml(files) {
    if (files.length === 0) {
        return getEmptyStateHtml();
    }
    return files.map(file => getFileRowHtml(file)).join('');
}

module.exports = {
    getDeleteModalHtml,
    getFileListHtml
}; 