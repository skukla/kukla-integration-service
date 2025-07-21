/**
 * Files CSV Export
 * Complete CSV export capability with storage strategies
 */

const { buildStorageParams } = require('./shared/file-utils');
const { initializeStorageStrategy } = require('./shared/storage-strategies');
const { response } = require('../shared/http/responses');
const { createUrlBuilders } = require('../shared/routing/url-factory');

// Business Workflows

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
  const configuredFilename = config.main?.csvFilename;
  const fileName = params.fileName || configuredFilename;

  if (!fileName) {
    throw new Error(
      'CSV filename is required - configure main.csvFilename or provide params.fileName'
    );
  }

  const storageParams = prepareCsvStorageParams(csvData, fileName, config, params);
  const storageResult = await storeCsvWithStrategy(storageParams, config, params);

  return buildCsvExportResponse(storageResult, storageParams, config);
}

// Feature Operations

/**
 * Store CSV using determined storage strategy
 * @purpose Execute CSV storage using appropriate strategy based on configuration
 * @param {Object} storageParams - Complete storage parameters including content and metadata
 * @param {Object} config - Application configuration with storage provider settings
 * @param {Object} params - Additional parameters for storage configuration
 * @returns {Promise<Object>} Storage operation result with metadata and URLs
 * @usedBy CSV export workflows requiring storage execution
 */
async function storeCsvWithStrategy(storageParams, config, params) {
  const strategy = await initializeStorageStrategy(config, params);
  return await strategy.store(storageParams);
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
 * Build CSV export response
 * @purpose Build complete export response with storage result and download URLs
 * @param {Object} storageResult - Result from storage operation
 * @param {Object} storageParams - Storage parameters used for operation
 * @param {Object} config - Application configuration for URL building
 * @returns {Object} Complete CSV export response with download information
 * @usedBy CSV export workflows requiring response building
 */
function buildCsvExportResponse(storageResult, storageParams, config) {
  const { downloadUrl: buildDownloadActionUrl } = createUrlBuilders(config);
  const actionDownloadUrl = buildDownloadActionUrl(storageParams.fileName);

  const presignedUrl = storageResult.downloadUrl;

  // Calculate expiry hours for display purposes
  const expiryHours = Math.round(storageResult.expirySeconds / 3600);

  const downloadUrls = {
    action: actionDownloadUrl,
    presigned: presignedUrl,
    expiryHours: expiryHours,
  };

  return response.success(
    {
      downloadUrls,
      storage: storageResult.storage,
      fileName: storageParams.fileName,
      fileSize: storageParams.size,
      mimeType: storageParams.mimeType,
    },
    'CSV export completed successfully'
  );
}

module.exports = {
  exportCsvWithStorage,
  storeCsvWithStrategy,
  prepareCsvStorageParams,
  buildCsvExportResponse,
};
