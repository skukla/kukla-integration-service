/**
 * File Browser Action
 * Business capability: Browse and list CSV files with interactive UI generation
 */

const { browseCsvFilesWithMetadata } = require('../../src/files/file-browser');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * File browsing business logic
 * @purpose Browse and list CSV files with comprehensive metadata
 * @param {Object} context - Initialized action context with config and parameters
 * @returns {Promise<Object>} File listing with metadata for UI consumption
 * @usedBy Adobe App Builder frontend via HTMX
 * @config storage.provider, storage.directory, files.extensions.csv
 */
async function browseFilesBusinessLogic(context) {
  const { config, extractedParams } = context;

  return await browseCsvFilesWithMetadata(config, extractedParams);
}

module.exports = createAction(browseFilesBusinessLogic, {
  actionName: 'browse-files',
  withLogger: false,
  description: 'Browse files in storage',
});
