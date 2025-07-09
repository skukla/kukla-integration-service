/**
 * Files Workflows
 *
 * High-level orchestration functions that combine multiple operations
 * to accomplish complete file management workflows.
 * These are the functions users actually want to call.
 */

const { selectStorageStrategy } = require('../strategies/storage-strategies');
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
  return await selectStorageStrategy(provider, config, params);
}

/**
 * Stores a CSV file with proper error handling and metadata
 * Complete workflow for CSV file storage with error handling.
 *
 * @param {string} csvData - CSV content to store
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @param {string} [fileName] - Name of the file to store
 * @returns {Promise<Object>} Storage result with download URL and metadata
 */
async function storeCsvFile(csvData, config, params, fileName) {
  const finalFileName = fileName || config.storage.csv.filename;
  try {
    const storage = await initializeStorage(config, params);
    const result = await storage.write(finalFileName, csvData);

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
  return allFiles.filter((file) => file.name.endsWith(config.files.extensions.csv));
}

/**
 * Complete CSV export workflow with storage and metadata
 * High-level workflow that combines CSV generation and storage with proper metadata.
 *
 * @param {string} csvData - CSV content to store
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @param {string} [fileName='products.csv'] - Name of the file to store
 * @returns {Promise<Object>} Storage result with comprehensive metadata
 */
async function exportCsvWithStorage(csvData, config, params, fileName) {
  const finalFileName = fileName || config.storage.csv.filename;
  const storageResult = await storeCsvFile(csvData, config, params, finalFileName);

  if (!storageResult.stored) {
    throw new Error(
      `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`
    );
  }

  return {
    downloadUrl: storageResult.downloadUrl,
    storage: {
      provider: storageResult.provider,
      location: storageResult.fileName,
      properties: storageResult.properties,
    },
    storageResult,
  };
}

/**
 * File download workflow with error handling and content type detection
 * Complete workflow for file downloads with proper headers and error handling.
 *
 * @param {string} fileName - Name of the file to download
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Download response with proper headers
 */
async function downloadFileWorkflow(fileName, config, params) {
  try {
    const fileContent = await readStoredFile(fileName, config, params);
    const cleanFileName = extractCleanFilename(fileName);

    // Set proper content type
    const contentType = fileName.endsWith(config.files.extensions.csv)
      ? config.files.contentTypes.csv
      : config.files.contentTypes.binary;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
        'Cache-Control': 'no-cache',
      },
      body: fileContent.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    if (error.message.includes('not found') || error.code === 'NoSuchKey') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `File not found: ${fileName}`,
        }),
      };
    }
    throw error;
  }
}

/**
 * Get all CSV files from storage - uses configuration for file extensions
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Array>} Array of CSV files
 */
async function getCsvFiles(config, params) {
  const storage = await initializeStorage(config, params);
  const allFiles = await storage.list();
  return allFiles.filter((file) => file.name.endsWith(config.files.extensions.csv));
}

module.exports = {
  initializeStorage,
  storeCsvFile,
  readStoredFile,
  deleteStoredFile,
  listCsvFiles,
  exportCsvWithStorage,
  downloadFileWorkflow,
  getCsvFiles,
};
