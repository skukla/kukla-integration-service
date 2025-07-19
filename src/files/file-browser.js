/**
 * Files File Browser - Feature Core
 * Complete file browsing capability - Feature Core with Sub-modules
 */

// Import from feature sub-modules (same domain)
const {
  enrichFilesWithMetadata,
  validateBrowserResults,
} = require('./file-browser/metadata-processing');
const { processBrowserFiles, sortFilesByDate } = require('./file-browser/sorting-filtering');
const { listCsvFiles, getFileMetadata } = require('./file-browser/storage-operations');

// Business Workflows

/**
 * Complete file browser data workflow with comprehensive metadata
 * @purpose Execute complete file browser workflow with metadata enrichment and sorting
 * @param {Object} config - Complete configuration object
 * @param {Object} params - Action parameters containing credentials
 * @param {Object} [options={}] - Browse options including sorting and filtering
 * @returns {Promise<Array>} Sorted array of file objects with complete metadata
 * @throws {Error} When storage access fails or configuration is invalid
 * @usedBy browse-files action, file browser UI components
 */
async function browseCsvFilesWithMetadata(config, params, options = {}) {
  try {
    // Step 1: Get CSV files from storage with basic metadata
    const files = await listCsvFiles(config, params);

    // Step 2: Enrich files with additional metadata if requested
    const enrichedFiles = options.enrichMetadata
      ? await enrichFilesWithMetadata(files, config, params)
      : files;

    // Step 3: Apply sorting and filtering
    const processedFiles = processBrowserFiles(enrichedFiles, options);

    // Step 4: Validate and return results
    return validateBrowserResults(processedFiles);
  } catch (error) {
    throw new Error(`File browser workflow failed: ${error.message}`);
  }
}

/**
 * Basic file browser data workflow
 * @purpose Get CSV files with basic metadata and default sorting
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Array>} Array of CSV file objects sorted by last modified date
 * @usedBy browse-files action, file browser UI
 */
async function browseCsvFiles(config, params) {
  try {
    // Step 1: Get CSV files from storage
    const files = await listCsvFiles(config, params);

    // Step 2: Sort by date (most recent first)
    const sortedFiles = sortFilesByDate(files, 'desc');

    // Step 3: Validate and return results
    return validateBrowserResults(sortedFiles);
  } catch (error) {
    throw new Error(`Basic file browser failed: ${error.message}`);
  }
}

module.exports = {
  // Business workflows
  browseCsvFilesWithMetadata,
  browseCsvFiles,
  getFileMetadata,

  // Feature operations
  listCsvFiles,
  enrichFilesWithMetadata,
  processBrowserFiles,

  // Feature utilities
  sortFilesByDate,
  validateBrowserResults,
};
