/**
 * Files CSV Export
 * Complete CSV export capability with storage, presigned URLs, and error handling
 */

const { initializeStorageStrategy } = require('./shared/storage-strategies');
const { formatFileSize } = require('../shared/utils/formatting');

// Business Workflows

/**
 * Complete CSV export with storage and fallback handling
 * @purpose Execute complete CSV export pipeline with multiple storage strategies and comprehensive error recovery
 * @param {string} csvData - CSV content to export
 * @param {Object} config - Complete configuration object
 * @param {Object} params - Action parameters containing credentials and settings
 * @param {string} [fileName] - Optional custom filename
 * @param {Object} [options={}] - Export options including storage strategy overrides
 * @returns {Promise<Object>} Complete export result with download URLs, storage info, and fallback data
 * @throws {Error} When all storage strategies fail
 * @usedBy get-products action, get-products-mesh action
 * @config storage.provider, storage.directory, storage.s3, files.extensions.csv
 */
async function exportCsvWithStorageAndFallback(csvData, config, params, fileName, options = {}) {
  try {
    // Step 1: Attempt primary storage method
    const primaryResult = await exportCsvWithStorage(csvData, config, params, fileName, options);

    if (primaryResult.stored) {
      return {
        ...primaryResult,
        method: 'primary-storage',
        fallbackUsed: false,
      };
    }

    // Step 2: If primary fails, attempt alternative storage
    const fallbackConfig = {
      ...config,
      storage: {
        ...config.storage,
        provider: config.storage.provider === 's3' ? 'app-builder' : 's3',
      },
    };

    const fallbackResult = await exportCsvWithStorage(
      csvData,
      fallbackConfig,
      params,
      fileName,
      options
    );

    return {
      ...fallbackResult,
      method: 'fallback-storage',
      fallbackUsed: true,
      originalError: primaryResult.error,
    };
  } catch (error) {
    throw new Error(`CSV export failed: ${error.message}`);
  }
}

/**
 * Complete CSV export with storage
 * @purpose Execute complete CSV export pipeline with configured storage provider
 * @param {string} csvData - CSV content to export
 * @param {Object} config - Complete configuration object
 * @param {Object} params - Action parameters containing credentials
 * @param {string} [fileName] - Optional custom filename
 * @param {Object} [options={}] - Export options
 * @returns {Promise<Object>} Export result with storage metadata and download URLs
 * @usedBy exportCsvWithStorageAndFallback, external actions needing CSV export
 * @config storage.provider, storage.directory, files.extensions.csv
 */
async function exportCsvWithStorage(csvData, config, params, fileName, options = {}) {
  try {
    // Step 1: Prepare storage parameters and filename
    const storageParams = prepareCsvStorageParams(csvData, config, fileName, options);

    // Step 2: Initialize storage strategy
    const storage = await initializeStorageStrategy(config.storage.provider, config, params);

    // Step 3: Store CSV file using configured strategy
    const storageResult = await storeCsvWithStrategy(
      storage,
      storageParams.fileName,
      storageParams.csvData,
      config,
      storageParams.options
    );

    // Step 4: Build complete export response
    return buildCsvExportResponse(storageResult, storage);
  } catch (error) {
    return {
      stored: false,
      error: {
        message: error.message,
        operation: 'csv-export',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Basic CSV export without storage
 * @purpose Generate CSV content and metadata without storage operations
 * @param {string} csvData - CSV content to process
 * @param {Object} config - Configuration object
 * @param {string} [fileName] - Optional filename
 * @returns {Object} CSV export data without storage
 * @usedBy Testing scenarios, in-memory CSV processing
 */
function exportCsvDataOnly(csvData, config, fileName) {
  const finalFileName = fileName || generateDefaultCsvFileName(config);

  return {
    csvData,
    fileName: finalFileName,
    size: csvData.length,
    formattedSize: formatFileSize(csvData.length),
    contentType: 'text/csv',
    timestamp: new Date().toISOString(),
  };
}

// Feature Operations

/**
 * Store CSV with smart file existence strategy
 * @purpose Coordinate CSV storage with intelligent handling of existing files
 * @param {Object} storage - Storage wrapper instance
 * @param {string} fileName - Name of the file to store
 * @param {string} csvData - CSV content to store
 * @param {Object} config - Configuration object
 * @param {Object} options - Storage options including useCase for access patterns
 * @returns {Promise<Object>} Storage result with operation metadata
 * @usedBy exportCsvWithStorage
 */
async function storeCsvWithStrategy(storage, fileName, csvData, config, options = {}) {
  try {
    // Check if file already exists
    const existingFile = await storage.getProperties(fileName);
    const fileExists = existingFile !== null;

    let result;
    let urlGenerated = false;

    if (!fileExists) {
      // File doesn't exist → Create new file + generate presigned URL
      result = await storage.write(fileName, csvData, options);
      urlGenerated = true;
    } else {
      // File exists → Update content only, preserve existing presigned URL
      result = await updateContentOnly(storage, fileName, csvData, config);
      urlGenerated = false;
    }

    return {
      result,
      fileExisted: fileExists,
      urlGenerated,
      operation: fileExists ? 'content-update' : 'new-file',
    };
  } catch (error) {
    throw new Error(`CSV storage strategy failed: ${error.message}`);
  }
}

/**
 * Update file content without generating presigned URLs
 * @purpose Update existing file content while preserving existing presigned URLs
 * @param {Object} storage - Storage wrapper instance
 * @param {string} fileName - Name of the file
 * @param {string} content - File content
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Content update result
 * @usedBy storeCsvWithStrategy
 */
async function updateContentOnly(storage, fileName, content, config) {
  const { updateContentOnly: updateOperation } = require('./operations/content-only');
  return await updateOperation(storage, fileName, content, config);
}

// Feature Utilities

/**
 * Prepare CSV storage parameters
 * @purpose Process and validate CSV data and filename for storage operations
 * @param {string} csvData - CSV content
 * @param {Object} config - Configuration object
 * @param {string} fileName - Base filename
 * @param {Object} options - Storage options
 * @returns {Object} Processed storage parameters
 * @usedBy exportCsvWithStorage
 */
function prepareCsvStorageParams(csvData, config, fileName, options = {}) {
  if (!csvData || typeof csvData !== 'string') {
    throw new Error('CSV data must be a non-empty string');
  }

  let finalFileName = fileName || generateDefaultCsvFileName(config);
  const csvExtension = config.files.extensions.csv;

  if (!finalFileName.endsWith(csvExtension)) {
    finalFileName = `${finalFileName}${csvExtension}`;
  }

  return {
    fileName: finalFileName,
    csvData,
    options: {
      useCase: 'csv-export',
      contentType: 'text/csv',
      ...options,
    },
  };
}

/**
 * Generate default CSV filename
 * @purpose Create standardized filename for CSV exports
 * @param {Object} config - Configuration object
 * @returns {string} Generated filename
 * @usedBy prepareCsvStorageParams, exportCsvDataOnly
 */
function generateDefaultCsvFileName(config) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = config.files.extensions.csv;
  return `export-${timestamp}${extension}`;
}

/**
 * Build CSV export response
 * @purpose Create standardized response for CSV export operations
 * @param {Object} storageResult - Result from storage operation
 * @param {Object} storage - Storage wrapper instance
 * @returns {Object} Formatted CSV export response
 * @usedBy exportCsvWithStorage
 */
function buildCsvExportResponse(storageResult, storage) {
  const { result, fileExisted, urlGenerated, operation } = storageResult;

  return {
    stored: true,
    downloadUrl: result.downloadUrl,
    presignedUrl: result.presignedUrl,
    storage: {
      provider: storage.provider,
      operation,
      fileExisted,
      urlGenerated,
      fileName: result.fileName,
      properties: result.properties,
    },
    file: {
      name: result.properties.name,
      size: result.properties.size,
      formattedSize: formatFileSize(result.properties.size),
      contentType: result.properties.contentType,
      lastModified: result.properties.lastModified,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate CSV export parameters
 * @purpose Ensure all required parameters are present and valid
 * @param {string} csvData - CSV content to validate
 * @param {Object} config - Configuration object to validate
 * @param {Object} params - Action parameters to validate
 * @throws {Error} When validation fails
 * @usedBy exportCsvWithStorage, exportCsvWithStorageAndFallback
 */
function validateCsvExportParams(csvData, config, params) {
  if (!csvData || typeof csvData !== 'string') {
    throw new Error('CSV data is required and must be a string');
  }

  if (!config || !config.storage) {
    throw new Error('Storage configuration is required');
  }

  if (!config.storage.provider) {
    throw new Error('Storage provider must be specified');
  }

  if (!params) {
    throw new Error('Action parameters are required for storage authentication');
  }
}

module.exports = {
  // Business workflows (main exports that actions import)
  exportCsvWithStorageAndFallback,
  exportCsvWithStorage,
  exportCsvDataOnly,

  // Feature operations (coordination functions)
  storeCsvWithStrategy,
  updateContentOnly,

  // Feature utilities (building blocks)
  prepareCsvStorageParams,
  generateDefaultCsvFileName,
  buildCsvExportResponse,
  validateCsvExportParams,
};
