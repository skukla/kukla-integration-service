/**
 * Files Storage Operations
 *
 * Higher-level storage operations that coordinate storage strategies and business logic
 */

const { storeCsvWithStrategy, prepareCsvStorageParams } = require('./csv-storage');
const { generatePresignedUrl } = require('./presigned-urls');
const {
  buildStorageResponse,
  buildStorageErrorResponse,
  buildPresignedUrlResponse,
  buildPresignedUrlErrorResponse,
} = require('./response-building');
const { selectStorageStrategy } = require('../strategies/storage-strategies');
const { removePublicPrefix } = require('../utils/paths');

// === CSV STORAGE OPERATIONS ===

/**
 * Store CSV file with presigned URL management
 * Used by: Business workflows requiring CSV storage with strategy selection
 * @param {string} csvData - CSV content
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {string} [fileName] - File name
 * @param {Object} [options={}] - Storage options
 * @returns {Promise<Object>} Storage result with download URL
 */
async function storeCsvFile(csvData, config, params, fileName, options = {}) {
  try {
    // Step 1: Prepare storage parameters and filename
    const storageParams = prepareCsvStorageParams(csvData, config, fileName, options);

    // Step 2: Initialize storage strategy
    const storage = await selectStorageStrategy(config.storage.provider, config, params);

    // Step 3: Store file using configured strategy
    const storageResult = await storeCsvWithStrategy(
      storage,
      storageParams.fileName,
      storageParams.csvData,
      config,
      storageParams.options
    );

    // Step 4: Build success response with download URL
    return buildStorageResponse(storageResult, storage, config);
  } catch (error) {
    return buildStorageErrorResponse(error, 'store-csv');
  }
}

// === FILE LISTING OPERATIONS ===

/**
 * List CSV files in storage
 * Used by: File browser UI, file management workflows
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Array>} Array of CSV file objects
 */
async function listCsvFiles(config, params) {
  const storage = await selectStorageStrategy(config.storage.provider, config, params);
  const allFiles = await storage.list();
  return allFiles.filter((file) => file.name.endsWith(config.files.extensions.csv));
}

/**
 * Get CSV files (alias for listCsvFiles)
 * Used by: Components that prefer getCsvFiles naming convention
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Array>} Array of CSV files
 */
async function getCsvFiles(config, params) {
  return await listCsvFiles(config, params);
}

// === FILE ACCESS OPERATIONS ===

/**
 * Read stored file content
 * Used by: Download workflows, file access operations
 * @param {string} fileName - File name
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Buffer|string>} File content
 */
async function readStoredFile(fileName, config, params) {
  const storage = await selectStorageStrategy(config.storage.provider, config, params);
  const cleanFileName = removePublicPrefix(fileName);
  return await storage.read(cleanFileName);
}

/**
 * Delete stored file
 * Used by: File deletion workflows, cleanup operations
 * @param {string} fileName - File name
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<void>}
 */
async function deleteStoredFile(fileName, config, params) {
  const storage = await selectStorageStrategy(config.storage.provider, config, params);

  let targetFileName = fileName;
  if (storage.provider === 's3' && config.storage.s3?.prefix) {
    const fullPrefix = config.storage.s3.prefix + (config.storage.directory || '');
    if (fileName.startsWith(fullPrefix)) {
      targetFileName = fileName.substring(fullPrefix.length);
    } else {
      targetFileName = removePublicPrefix(fileName);
    }
  } else {
    targetFileName = removePublicPrefix(fileName);
  }

  await storage.delete(targetFileName);
}

// === STORAGE INFRASTRUCTURE OPERATIONS ===

/**
 * Initialize storage provider
 * Used by: Direct storage access patterns
 * @param {Object} config - Configuration object
 * @param {Object} [params={}] - Action parameters
 * @returns {Promise<Object>} Storage client
 */
async function initializeStorage(config, params = {}) {
  return await selectStorageStrategy(config.storage.provider, config, params);
}

/**
 * Generate presigned URL for system access
 * Used by: Direct presigned URL generation workflows
 * @param {string} fileName - File name
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [options={}] - URL options
 * @returns {Promise<Object>} Presigned URL response
 */
async function generateSystemPresignedUrl(fileName, config, params, options = {}) {
  try {
    const storage = await selectStorageStrategy(config.storage.provider, config, params);
    const systemOptions = {
      expiresIn: options.expiresIn || config.storage.presignedUrls.expiration.long,
      urlType: options.urlType || 'external',
      permissions: options.permissions || 'r',
      operation: 'download',
      useCase: options.useCase || 'system',
      ...options,
    };
    const presignedUrlResult = await generatePresignedUrl(storage, fileName, config, systemOptions);
    return buildPresignedUrlResponse(presignedUrlResult, storage, systemOptions, fileName);
  } catch (error) {
    return buildPresignedUrlErrorResponse(error, options);
  }
}

module.exports = {
  // CSV storage operations
  storeCsvFile,

  // File listing operations
  listCsvFiles,
  getCsvFiles,

  // File access operations
  readStoredFile,
  deleteStoredFile,

  // Storage infrastructure operations
  initializeStorage,
  generateSystemPresignedUrl,
};
