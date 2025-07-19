/**
 * Files File Browser
 * Complete file browser capability with metadata enrichment and sorting
 */

// Import from feature sub-modules (same domain)
const {
  enrichFilesWithMetadata,
  validateBrowserResults,
} = require('./file-browser/metadata-processing');
const { processBrowserFiles, sortFilesByDate } = require('./file-browser/sorting-filtering');
const { listCsvFiles, getFileMetadata } = require('./file-browser/storage-operations');
const { response } = require('../shared/http/responses');

// Business Workflows

/**
 * Browse CSV files with metadata enrichment
 * @purpose Browse CSV files with complete metadata enrichment and filtering capabilities
 * @param {Object} config - Application configuration with storage and browser settings
 * @param {Object} params - Browser parameters including filters and sorting options
 * @returns {Promise<Object>} File browser response with enriched file metadata
 * @usedBy File browser workflows requiring complete metadata and filtering
 */
async function browseCsvFilesWithMetadata(config, params) {
  try {
    const rawFiles = await listCsvFiles(config, params);
    const enrichedFiles = await enrichFilesWithMetadata(rawFiles, config);
    const processedFiles = processBrowserFiles(enrichedFiles, params);

    return response.success(
      {
        files: processedFiles.files,
        metadata: processedFiles.metadata,
        totalFiles: processedFiles.totalFiles,
        hasMore: processedFiles.hasMore,
      },
      'Files retrieved successfully',
      {
        storageProvider: config.storage.provider,
        processingTime: processedFiles.processingTime,
      }
    );
  } catch (error) {
    return response.error(error, {
      operation: 'file-browser',
      params: params,
    });
  }
}

/**
 * Browse CSV files with basic listing
 * @purpose Browse CSV files with basic file listing without metadata enrichment
 * @param {Object} config - Application configuration with storage settings
 * @param {Object} params - Browser parameters for basic file listing
 * @returns {Promise<Object>} Basic file browser response with file list
 * @usedBy Simple file browser workflows not requiring metadata enrichment
 */
async function browseCsvFiles(config, params) {
  try {
    const files = await listCsvFiles(config, params);

    return response.success(
      {
        files: files,
        totalFiles: files.length,
      },
      'Files listed successfully',
      {
        storageProvider: config.storage.provider,
        enriched: false,
      }
    );
  } catch (error) {
    return response.error(error, {
      operation: 'file-browser-basic',
      params: params,
    });
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
