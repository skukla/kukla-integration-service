/**
 * Files Workflows
 *
 * High-level orchestration functions that combine multiple operations
 * to accomplish complete file management workflows.
 * Pure orchestration following DDD patterns - delegates to operations layer.
 */

const { storeCsvWithStrategy, prepareCsvStorageParams } = require('../operations/csv-storage');
const { generatePresignedUrl } = require('../operations/presigned-urls');
const {
  buildStorageResponse,
  buildStorageErrorResponse,
  buildExportCsvResponse,
  buildDownloadResponse,
  buildDownloadErrorResponse,
  buildPresignedUrlResponse,
  buildPresignedUrlErrorResponse,
} = require('../operations/response-building');
const { selectStorageStrategy } = require('../strategies/storage-strategies');
const { removePublicPrefix } = require('../utils/paths');

/**
 * Initialize storage provider based on configuration
 * Wrapper for selectStorageStrategy to maintain backward compatibility.
 *
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} [params] - Action parameters containing credentials
 * @returns {Promise<Object>} Initialized storage client
 * @throws {Error} If storage provider is unknown or initialization fails
 */
async function initializeStorage(config, params = {}) {
  return await selectStorageStrategy(config.storage.provider, config, params);
}

/**
 * Stores a CSV file with smart presigned URL management
 * Pure orchestration workflow that delegates to operations layer.
 * - New files: Creates file + generates presigned URL
 * - Existing files: Updates content only, preserves existing presigned URL
 *
 * @param {string} csvData - CSV content to store
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @param {string} [fileName] - Name of the file to store
 * @param {Object} [options] - Additional options including useCase for access patterns
 * @param {string} [options.useCase] - Use case for access pattern (e.g., 'adobeTarget', 'user')
 * @returns {Promise<Object>} Storage result with download URL and metadata
 */
async function storeCsvFile(csvData, config, params, fileName, options = {}) {
  try {
    // Step 1: Prepare and validate parameters
    const storageParams = prepareCsvStorageParams(csvData, config, fileName, options);

    // Step 2: Initialize storage provider
    const storage = await selectStorageStrategy(config.storage.provider, config, params);

    // Step 3: Execute storage strategy
    const storageResult = await storeCsvWithStrategy(
      storage,
      storageParams.fileName,
      storageParams.csvData,
      config,
      storageParams.options
    );

    // Step 4: Build standardized response
    return buildStorageResponse(storageResult, storage, config);
  } catch (error) {
    return buildStorageErrorResponse(error);
  }
}

/**
 * Reads a file with automatic path cleaning and error handling
 * Pure orchestration workflow that delegates to storage wrapper.
 *
 * @param {string} fileName - Name of the file to read
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Buffer>} File content
 */
async function readStoredFile(fileName, config, params) {
  // Step 1: Initialize storage provider
  const storage = await selectStorageStrategy(config.storage.provider, config, params);

  // Step 2: Read file using storage wrapper
  const cleanFileName = removePublicPrefix(fileName);
  return await storage.read(cleanFileName);
}

/**
 * Deletes a file with automatic path cleaning and error handling
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {string} fileName - Name of the file to delete
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<void>}
 */
async function deleteStoredFile(fileName, config, params) {
  // Step 1: Initialize storage provider
  const storage = await selectStorageStrategy(config.storage.provider, config, params);

  // Step 2: Delete file using storage wrapper
  // For S3, if fileName already includes the full path (prefix + directory),
  // we need to extract just the relative part for the storage wrapper
  let targetFileName = fileName;

  // If using S3 and fileName includes the full S3 prefix, extract the relative path
  if (storage.provider === 's3' && config.storage.s3?.prefix) {
    const fullPrefix = config.storage.s3.prefix + (config.storage.directory || '');
    if (fileName.startsWith(fullPrefix)) {
      targetFileName = fileName.substring(fullPrefix.length);
    } else {
      // Use removePublicPrefix for backward compatibility with simple filenames
      targetFileName = removePublicPrefix(fileName);
    }
  } else {
    targetFileName = removePublicPrefix(fileName);
  }

  await storage.delete(targetFileName);
}

/**
 * Lists CSV files with filtering and metadata
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Array>} Array of CSV file objects
 */
async function listCsvFiles(config, params) {
  // Step 1: Initialize storage provider
  const storage = await selectStorageStrategy(config.storage.provider, config, params);

  // Step 2: List all files and filter for CSV
  const allFiles = await storage.list();
  return allFiles.filter((file) => file.name.endsWith(config.files.extensions.csv));
}

/**
 * Complete CSV export workflow with storage and metadata
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {string} csvData - CSV content to store
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @param {string} [fileName='products.csv'] - Name of the file to store
 * @returns {Promise<Object>} Storage result with comprehensive metadata
 */
async function exportCsvWithStorage(csvData, config, params, fileName) {
  // Step 1: Store CSV file using orchestrated workflow
  const storageResult = await storeCsvFile(csvData, config, params, fileName);

  // Step 2: Build export response with metadata
  return buildExportCsvResponse(storageResult);
}

/**
 * File download workflow with error handling and content type detection
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {string} fileName - Name of the file to download
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Download response with proper headers
 */
async function downloadFileWorkflow(fileName, config, params) {
  try {
    // Step 1: Initialize storage provider
    const storage = await selectStorageStrategy(config.storage.provider, config, params);

    // Step 2: Read file content using storage wrapper
    const cleanFileName = removePublicPrefix(fileName);
    const fileContent = await storage.read(cleanFileName);

    // Step 3: Build download response
    return buildDownloadResponse(fileName, fileContent, config);
  } catch (error) {
    return buildDownloadErrorResponse(error, fileName);
  }
}

/**
 * Get all CSV files from storage - uses configuration for file extensions
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Array>} Array of CSV files
 */
async function getCsvFiles(config, params) {
  // Delegate to listCsvFiles for consistency
  return await listCsvFiles(config, params);
}

/**
 * Generate presigned URL for system access
 * Pure orchestration workflow that delegates to operations layer.
 * Optimized for direct access without going through action endpoints.
 *
 * @param {string} fileName - Name of the file
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @param {Object} [options] - Presigned URL options
 * @param {number} [options.expiresIn] - Expiration time in seconds
 * @param {string} [options.urlType] - URL type: 'external' (CDN) or 'internal' (direct storage)
 * @param {string} [options.permissions] - Permissions: 'r', 'rw', 'rwd'
 * @param {string} [options.useCase] - Use case: 'system', 'user', 'api'
 * @returns {Promise<Object>} Presigned URL response with metadata
 */
async function generateSystemPresignedUrl(fileName, config, params, options = {}) {
  try {
    // Step 1: Initialize storage provider
    const storage = await selectStorageStrategy(config.storage.provider, config, params);

    // Step 2: Configure options for system access
    const systemOptions = {
      expiresIn: options.expiresIn || config.storage.presignedUrls.expiration.long,
      urlType: options.urlType || 'external', // Default to CDN-based for external systems
      permissions: options.permissions || 'r', // Default to read-only
      operation: 'download',
      useCase: options.useCase || 'system',
      ...options,
    };

    // Step 3: Generate presigned URL using operations layer
    const presignedUrlResult = await generatePresignedUrl(storage, fileName, config, systemOptions);

    // Step 4: Build presigned URL response
    return buildPresignedUrlResponse(presignedUrlResult, storage, systemOptions, fileName);
  } catch (error) {
    return buildPresignedUrlErrorResponse(error, options);
  }
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
  generateSystemPresignedUrl,
};
