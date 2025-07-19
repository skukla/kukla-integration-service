/**
 * File Browser - Storage Operations Sub-module
 * All storage initialization, file listing, and metadata retrieval utilities
 */

const { initializeStorageStrategy } = require('../shared/storage-strategies');

// Storage Operations Workflows

/**
 * List CSV files from storage
 * @purpose Get list of CSV files from configured storage provider
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Array>} Array of CSV file objects with basic metadata
 * @usedBy browseCsvFilesWithMetadata, browseCsvFiles
 */
async function listCsvFiles(config, params) {
  const storage = await initializeStorageStrategy(config, params);
  const allFiles = await storage.list();

  // Filter for CSV files only
  const csvExtension = config.files.extensions.csv;
  return allFiles.filter((file) => file.name.endsWith(csvExtension));
}

/**
 * Get file metadata from storage
 * @purpose Retrieve metadata for a single file from storage
 * @param {string} fileName - Name of the file
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object|null>} File metadata object or null if not found
 * @usedBy File management operations
 */
async function getFileMetadata(fileName, config, params) {
  try {
    const storage = await initializeStorageStrategy(config, params);
    return await getFileMetadataForFile(storage, fileName, config);
  } catch (error) {
    console.warn(`Failed to get metadata for ${fileName}:`, error.message);
    return null;
  }
}

// Storage Operations Utilities

/**
 * Create App Builder storage wrapper for browser operations
 * @purpose Wrap App Builder Files client with browser-specific methods
 * @param {Object} files - App Builder Files client
 * @returns {Object} Storage wrapper with browser methods
 * @usedBy initializeAppBuilderStorage
 */
function createAppBuilderBrowserWrapper(files) {
  return {
    async list() {
      try {
        const fileList = await files.list();
        return fileList.map((file) => ({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          contentType: file.contentType,
          url: file.url,
        }));
      } catch (error) {
        throw new Error(`App Builder file listing failed: ${error.message}`);
      }
    },

    async getProperties(fileName) {
      try {
        return await files.getProperties(fileName);
      } catch (error) {
        throw new Error(`Failed to get file properties: ${error.message}`);
      }
    },
  };
}

/**
 * Get metadata for a single file
 * @purpose Retrieve and format metadata for a specific file
 * @param {Object} storage - Storage wrapper instance
 * @param {string} fileName - Name of the file
 * @param {Object} config - Configuration object
 * @returns {Promise<Object|null>} File metadata object or null if failed
 * @usedBy getFileMetadata, enrichFilesWithMetadata
 */
async function getFileMetadataForFile(storage, fileName, config) {
  try {
    const properties = await storage.getProperties(fileName);
    if (!properties) return null;

    return formatFileMetadata(properties, fileName, config);
  } catch (error) {
    console.warn(`Failed to get metadata for file ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Format file metadata for display
 * @purpose Convert raw file properties to display-friendly format
 * @param {Object} properties - Raw file properties from storage
 * @param {string} fileName - File name
 * @param {Object} config - Configuration object
 * @returns {Object} Formatted file metadata
 * @usedBy getFileMetadataForFile
 */
function formatFileMetadata(properties, fileName, config) {
  const { formatFileSize, formatDate } = require('../../shared/utils/formatting');
  const cleanFileName = removePublicPrefix(fileName, config.storage.directory);

  return {
    name: cleanFileName,
    fullPath: fileName,
    size: formatFileSize(properties.size || 0),
    rawSize: properties.size || 0,
    lastModified: formatDate(properties.lastModified),
    lastModifiedRaw: properties.lastModified,
    contentType: properties.contentType || 'text/csv',
    url: properties.url || null,
    isCSV: fileName.endsWith(config.files.extensions.csv),
  };
}

/**
 * Remove public prefix from file name
 * @purpose Clean filename by removing storage directory prefix
 * @param {string} fileName - Full file path/name
 * @param {string} storageDirectory - Storage directory prefix to remove
 * @returns {string} Clean filename without directory prefix
 * @usedBy formatFileMetadata
 */
function removePublicPrefix(fileName, storageDirectory = 'public/') {
  if (!fileName) return fileName;

  const prefix = storageDirectory.endsWith('/') ? storageDirectory : `${storageDirectory}/`;
  return fileName.replace(new RegExp(`^${prefix.replace('/', '\\/')}`), '');
}

module.exports = {
  // Workflows (used by feature core)
  listCsvFiles,
  getFileMetadata,

  // Utilities
  createAppBuilderBrowserWrapper,
  getFileMetadataForFile,
  formatFileMetadata,
  removePublicPrefix,
};
