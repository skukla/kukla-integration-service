/**
 * Files CSV Export
 * Complete CSV export capability with storage strategies and fallback handling
 */

const { buildStorageParams } = require('./shared/file-utils');
const { initializeStorageStrategy } = require('./shared/storage-strategies');
const { response } = require('../shared/http/responses');

// Business Workflows

/**
 * Export CSV with storage and fallback handling
 * @purpose Export CSV data with comprehensive storage strategy and fallback options
 * @param {string} csvData - CSV content to export and store
 * @param {Object} config - Application configuration with storage settings
 * @param {Object} params - Export parameters including filename and storage options
 * @returns {Promise<Object>} Export response with storage result and download information
 * @usedBy Product export workflows requiring robust CSV storage with fallbacks
 */
async function exportCsvWithStorageAndFallback(csvData, config, params) {
  try {
    return await exportCsvWithStorage(csvData, config, params);
  } catch (error) {
    console.warn('Primary CSV export failed, attempting content-only fallback:', error.message);
    return await exportCsvDataOnly(csvData, config, params);
  }
}

/**
 * Export CSV with storage strategy
 * @purpose Export CSV data using configured storage strategy with presigned URLs
 * @param {string} csvData - CSV content to export and store
 * @param {Object} config - Application configuration with storage settings
 * @param {Object} params - Export parameters including filename and storage options
 * @returns {Promise<Object>} Export response with storage result and download URLs
 * @usedBy Primary CSV export workflow with storage capabilities
 */
async function exportCsvWithStorage(csvData, config, params) {
  const fileName = params.fileName || generateDefaultCsvFileName();
  const storageParams = prepareCsvStorageParams(csvData, fileName, config, params);

  const storageResult = await storeCsvWithStrategy(storageParams, config);

  return buildCsvExportResponse(storageResult, storageParams);
}

/**
 * Export CSV data without storage (content-only)
 * @purpose Export CSV as direct content response without storage for fallback scenarios
 * @param {string} csvData - CSV content to return as response
 * @param {Object} config - Application configuration for response building
 * @param {Object} params - Export parameters including filename
 * @returns {Promise<Object>} Direct CSV content response without storage
 * @usedBy Fallback export when storage is unavailable or fails
 */
async function exportCsvDataOnly(csvData, config, params) {
  const fileName = params.fileName || generateDefaultCsvFileName();

  return updateContentOnly(csvData, fileName);
}

// Feature Operations

/**
 * Store CSV using determined storage strategy
 * @purpose Execute CSV storage using appropriate strategy based on configuration
 * @param {Object} storageParams - Complete storage parameters including content and metadata
 * @param {Object} config - Application configuration with storage provider settings
 * @returns {Promise<Object>} Storage operation result with metadata and URLs
 * @usedBy CSV export workflows requiring storage execution
 */
async function storeCsvWithStrategy(storageParams, config) {
  const strategy = await initializeStorageStrategy(config, {});

  return await strategy.store(storageParams);
}

/**
 * Update CSV export to content-only response
 * @purpose Build direct CSV content response for scenarios without storage
 * @param {string} csvData - CSV content for direct response
 * @param {string} fileName - Filename for response headers
 * @returns {Promise<Object>} Direct CSV content response with appropriate headers
 * @usedBy Content-only export and fallback scenarios
 */
async function updateContentOnly(csvData, fileName) {
  return response.success(
    {
      content: csvData,
      fileName: fileName,
      mimeType: 'text/csv',
      size: Buffer.byteLength(csvData, 'utf8'),
    },
    'CSV export completed (content-only)',
    {
      downloadType: 'content-only',
      storage: 'none',
    }
  );
}

// Feature Utilities

/**
 * Prepare CSV storage parameters
 * @purpose Build complete storage parameters object for CSV storage operations
 * @param {string} csvData - CSV content to store
 * @param {string} fileName - Target filename for storage
 * @param {Object} config - Application configuration with storage settings
 * @param {Object} params - Additional parameters for storage configuration
 * @returns {Object} Complete storage parameters for strategy execution
 * @usedBy Storage operations requiring parameter preparation
 */
function prepareCsvStorageParams(csvData, fileName, config, params) {
  const baseParams = buildStorageParams(fileName, config, params);

  return {
    ...baseParams,
    content: csvData,
    mimeType: 'text/csv',
    size: Buffer.byteLength(csvData, 'utf8'),
    metadata: {
      type: 'csv-export',
      source: params.source || 'unknown',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Generate default CSV filename
 * @purpose Create default filename for CSV exports when none is provided
 * @returns {string} Default CSV filename with timestamp
 * @usedBy CSV export when no filename is specified in parameters
 */
function generateDefaultCsvFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `export-${timestamp}.csv`;
}

/**
 * Build CSV export response
 * @purpose Build complete export response with storage result and metadata
 * @param {Object} storageResult - Result from storage operation
 * @param {Object} storageParams - Storage parameters used for operation
 * @returns {Object} Complete CSV export response with download information
 * @usedBy CSV export workflows requiring response building
 */
function buildCsvExportResponse(storageResult, storageParams) {
  return response.exportSuccess(
    {
      downloadUrl: storageResult.downloadUrl,
      storage: storageResult.storage,
      fileName: storageParams.fileName,
      fileSize: storageParams.size,
      mimeType: storageParams.mimeType,
    },
    'CSV export completed successfully',
    {
      storageProvider: storageResult.storage,
      metadata: storageParams.metadata,
    }
  );
}

/**
 * Validate CSV export parameters
 * @purpose Validate required parameters for CSV export operations
 * @param {string} csvData - CSV content to validate
 * @param {Object} params - Export parameters to validate
 * @throws {Error} When required parameters are missing or invalid
 * @usedBy CSV export workflows for parameter validation
 */
function validateCsvExportParams(csvData, params) {
  if (!csvData || typeof csvData !== 'string') {
    throw new Error('CSV data is required and must be a string');
  }

  if (csvData.length === 0) {
    throw new Error('CSV data cannot be empty');
  }

  if (params.fileName && !/\.(csv|txt)$/i.test(params.fileName)) {
    throw new Error('CSV filename must have .csv or .txt extension');
  }
}

module.exports = {
  // Business workflows
  exportCsvWithStorageAndFallback,
  exportCsvWithStorage,
  exportCsvDataOnly,

  // Feature operations
  storeCsvWithStrategy,
  updateContentOnly,

  // Feature utilities
  prepareCsvStorageParams,
  generateDefaultCsvFileName,
  buildCsvExportResponse,
  validateCsvExportParams,
};
