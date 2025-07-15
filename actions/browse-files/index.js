/**
 * Action for browsing and listing CSV files in storage
 * @module browse-files
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { buildRuntimeUrl } = require('../../src/core/routing/operations/runtime');
const { getCsvFiles } = require('../../src/files/workflows/file-management');

/**
 * Business logic for browse-files action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function browseFilesBusinessLogic(context) {
  const { core, config, extractedParams } = context;
  const steps = [];

  // Step 1: Input has been validated in the action factory
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Get list of CSV files from storage
  const fileList = await getCsvFiles(config, extractedParams);
  steps.push(core.formatStepMessage('browse-files', 'success', { count: fileList.length }));

  // Generate HTML for HTMX consumption
  const html = generateFileListHTML(fileList, config);

  // Return HTML response for HTMX
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
 * Generate HTML for file list that matches the frontend CSS table structure
 * @param {Array} files - Array of file objects
 * @param {Object} config - Configuration object
 * @returns {string} HTML string for file list
 */
function generateFileListHTML(files, config) {
  if (!files || files.length === 0) {
    return `
      <div class="table-row no-files">
        <div class="table-cell" colspan="4" style="text-align: center; padding: var(--spacing-lg);">
          <p>No exported files found.</p>
          <p class="text-muted">Use the export buttons above to create CSV files.</p>
        </div>
      </div>
    `;
  }

  return files
    .map((file) => {
      const downloadUrl =
        buildRuntimeUrl('download-file', null, config) +
        `?fileName=${encodeURIComponent(file.name)}`;

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
            <div class="table-actions">
              <a href="${downloadUrl}" 
                 class="btn btn-sm btn-primary"
                 download="${file.name}"
                 title="Download ${file.name}">
                Download
              </a>
              <button class="btn btn-sm btn-danger btn-outline"
                      data-action="delete"
                      data-file-name="${file.name}"
                      data-file-path="${file.fullPath || file.name}"
                      title="Delete ${file.name}">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Export the action with proper configuration
module.exports = createAction(browseFilesBusinessLogic, {
  actionName: 'browse-files',
  withTracing: false,
  withLogger: false,
  description: 'Browse files in storage',
});
