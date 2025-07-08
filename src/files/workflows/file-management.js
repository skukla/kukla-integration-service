/**
 * Files Workflows
 *
 * High-level orchestration functions that combine multiple operations
 * to accomplish complete file management workflows.
 * These are the functions users actually want to call.
 */

const { initializeAppBuilderStorage } = require('../operations/app-builder');
const { initializeS3Storage } = require('../operations/s3-storage');
const { extractCleanFilename } = require('../utils/paths');

/**
 * Initialize storage provider based on configuration
 * Complete workflow that determines provider and initializes appropriate storage.
 *
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} [params] - Action parameters containing credentials
 * @returns {Promise<Object>} Initialized storage client
 * @throws {Error} If storage provider is unknown or initialization fails
 */
async function initializeStorage(config, params = {}) {
  const provider = config.storage.provider;

  switch (provider) {
    case 'app-builder':
      try {
        return await initializeAppBuilderStorage(config, params);
      } catch (error) {
        throw new Error(`Adobe I/O Files storage initialization failed: ${error.message}`);
      }
    case 's3':
      try {
        return await initializeS3Storage(config, params);
      } catch (error) {
        throw new Error(`S3 storage initialization failed: ${error.message}`);
      }
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}

/**
 * Stores a CSV file with proper error handling and metadata
 * Complete workflow for CSV file storage with error handling.
 *
 * @param {string} csvData - CSV content to store
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @param {string} [fileName='products.csv'] - Name of the file to store
 * @returns {Promise<Object>} Storage result with metadata
 */
async function storeCsvFile(csvData, config, params, fileName = 'products.csv') {
  try {
    const storage = await initializeStorage(config, params);
    const result = await storage.write(fileName, csvData);

    return {
      stored: true,
      provider: storage.provider,
      fileName: result.fileName,
      url: result.url,
      downloadUrl: result.downloadUrl,
      properties: result.properties,
    };
  } catch (error) {
    return {
      stored: false,
      error: {
        message: error.message,
        type: error.type || 'STORAGE_ERROR',
      },
    };
  }
}

/**
 * Reads a file with automatic path cleaning and error handling
 * Complete workflow for file reading with path normalization.
 *
 * @param {string} fileName - Name of the file to read
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Buffer>} File content
 */
async function readStoredFile(fileName, config, params) {
  const storage = await initializeStorage(config, params);
  const cleanFileName = extractCleanFilename(fileName);
  return await storage.read(cleanFileName);
}

/**
 * Deletes a file with automatic path cleaning and error handling
 * Complete workflow for file deletion with path normalization.
 *
 * @param {string} fileName - Name of the file to delete
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<void>}
 */
async function deleteStoredFile(fileName, config, params) {
  const storage = await initializeStorage(config, params);
  const cleanFileName = extractCleanFilename(fileName);
  await storage.delete(cleanFileName);
}

/**
 * Lists CSV files with filtering and metadata
 * Complete workflow for listing and filtering CSV files.
 *
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Array>} Array of CSV file objects
 */
async function listCsvFiles(config, params) {
  const storage = await initializeStorage(config, params);
  const allFiles = await storage.list();
  return allFiles.filter((file) => file.name.endsWith('.csv'));
}

module.exports = {
  initializeStorage,
  storeCsvFile,
  readStoredFile,
  deleteStoredFile,
  listCsvFiles,
};
