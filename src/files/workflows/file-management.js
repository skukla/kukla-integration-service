/**
 * Files Workflows
 *
 * Business workflows for file operations organized from composite to atomic
 */

const {
  buildExportCsvResponse,
  buildDownloadResponse,
  buildDownloadErrorResponse,
} = require('../operations/response-building');
const { storeCsvFile, listCsvFiles } = require('../operations/storage-operations');
const { selectStorageStrategy } = require('../strategies/storage-strategies');
const { removePublicPrefix } = require('../utils/paths');

// === BUSINESS WORKFLOWS ===

/**
 * Complete CSV export with storage
 * Used by: Actions needing complete CSV export pipeline
 * @param {string} csvData - CSV content
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {string} [fileName] - File name
 * @returns {Promise<Object>} Export result with metadata
 */
async function exportCsvWithStorage(csvData, config, params, fileName) {
  // Step 1: Store CSV file with configured storage provider
  const storageResult = await storeCsvFile(csvData, config, params, fileName);

  // Step 2: Build standardized export response with metadata
  return buildExportCsvResponse(storageResult);
}

/**
 * File download workflow with error handling
 * Used by: download-file action
 * @param {string} fileName - File name
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Download response with headers
 */
async function downloadFileWorkflow(fileName, config, params) {
  try {
    // Step 1: Initialize storage provider
    const storage = await selectStorageStrategy(config.storage.provider, config, params);

    // Step 2: Clean filename and read file content
    const cleanFileName = removePublicPrefix(fileName);
    const fileContent = await storage.read(cleanFileName);

    // Step 3: Build download response with proper headers
    return buildDownloadResponse(fileName, fileContent, config);
  } catch (error) {
    return buildDownloadErrorResponse(error, fileName);
  }
}

/**
 * File browser data workflow
 * Used by: browse-files action, file browser UI
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Array>} Array of CSV file objects for UI display
 */
async function fileBrowserDataWorkflow(config, params) {
  // Step 1: Get CSV files from storage
  const files = await listCsvFiles(config, params);

  // Step 2: Sort files by last modified date (newest first)
  return files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
}

module.exports = {
  // Business workflows (composite → atomic)
  exportCsvWithStorage,
  downloadFileWorkflow,
  fileBrowserDataWorkflow,
};
