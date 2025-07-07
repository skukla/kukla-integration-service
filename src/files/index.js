/**
 * Files Domain Catalog
 * @module files
 * @description Centralized access to all file operation functionality
 */

// Storage provider abstraction
const { CacheConfig, MemoryCache, HttpCache, FileCache } = require('./cache');
const {
  // Configuration
  getCsvConfig,
  // CSV generation
  generateCsv,
  createCsvStream,
  createCsvTransform,
  createWriter,
  // Utilities
  createRowTransformer,
  createCsvStringifier,
} = require('./csv');
const {
  // Error handling utilities
  createFileOperationError,
  isFileOperationError,
  mapErrorCodeToType,
  createUserFriendlyErrorMessage,
  createFileError,
  // File operations
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  getFileProperties,
  // Utilities
  getContentType,
  validatePath,
  removePublicPrefix,
  getFileMetadata,
} = require('./operations');
const {
  extractCleanFilename,
  addPublicPrefix,
  normalizePath,
  isPathSafe,
  joinPaths,
  getDirectory,
  getFilename,
  getExtension,
  changeExtension,
} = require('./paths');
const {
  initializeStorage,
  initializeAppBuilderStorage,
  initializeS3Storage,
} = require('./storage');

/**
 * High-level file management functions
 * These provide commonly used patterns for file operations
 */

/**
 * Stores a CSV file with proper error handling and metadata
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
 * Lists all CSV files with metadata
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Array<Object>>} Array of file metadata objects
 */
async function listCsvFiles(config, params) {
  const storage = await initializeStorage(config, params);
  const allFiles = await storage.list();
  return allFiles.filter((file) => file.name.endsWith('.csv'));
}

/**
 * Files domain public API
 * Organized by functional area for easy discovery
 */
module.exports = {
  // === DIRECT ACCESS CONVENIENCE FUNCTIONS ===
  // Most commonly used functions available directly
  storeCsv: storeCsvFile,
  initializeStorage,
  extractCleanFilename,
  deleteFile,
  readFile,
  writeFile,
  listFiles,
  getFileProperties,
  isFileOperationError,
  getFileErrorType: mapErrorCodeToType,
  filterCsvFiles: (files) => files.filter((file) => file.name.endsWith('.csv')),
  getStorageInfo: (storage) => ({
    provider: storage.provider,
    bucket: storage.bucket, // For S3
    namespace: storage.namespace, // For App Builder (if applicable)
  }),
  // === STORAGE PROVIDERS ===
  storage: {
    initializeStorage,
    initializeAppBuilderStorage,
    initializeS3Storage,
  },

  // === FILE OPERATIONS ===
  operations: {
    // Core operations
    readFile,
    writeFile,
    deleteFile,
    listFiles,
    getFileProperties,

    // High-level operations
    storeCsvFile,
    readStoredFile,
    deleteStoredFile,
    listCsvFiles,

    // Error handling
    createFileOperationError,
    isFileOperationError,
    createFileError,

    // Utilities
    getContentType,
    validatePath,
    getFileMetadata,
  },

  // === CSV OPERATIONS ===
  csv: {
    // Generation
    generateCsv,
    createCsvStream,
    createCsvTransform,
    createWriter,

    // Configuration
    getCsvConfig,

    // Utilities
    createRowTransformer,
    createCsvStringifier,
  },

  // === PATH UTILITIES ===
  paths: {
    extractCleanFilename,
    addPublicPrefix,
    normalizePath,
    isPathSafe,
    joinPaths,
    getDirectory,
    getFilename,
    getExtension,
    changeExtension,
    removePublicPrefix,
  },

  // === CACHE UTILITIES ===
  cache: {
    CacheConfig,
    MemoryCache,
    HttpCache,
    FileCache,
  },

  // === ERROR HANDLING ===
  errors: {
    mapErrorCodeToType,
    createUserFriendlyErrorMessage,
    createFileOperationError,
    isFileOperationError,
    createFileError,
  },
};
