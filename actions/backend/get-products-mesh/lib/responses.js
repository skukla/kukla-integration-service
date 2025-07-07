/**
 * Response creation functions for API Mesh operations
 * @module lib/responses
 */

// Import domain catalogs
const { shared } = require('../../../../src');

/**
 * Creates JSON response for API Mesh integration
 * @param {Object} builtProducts - Built product data
 * @param {Object} meshData - Mesh response data
 * @param {Array} steps - Processing steps
 * @returns {Object} JSON response
 */
function createJsonResponse(builtProducts, meshData, steps) {
  return shared.success(
    {
      products: builtProducts,
      total_count: builtProducts.length,
      message: meshData.message,
      status: meshData.status,
      steps,
      performance: meshData.performance,
    },
    'Product data retrieved successfully',
    {}
  );
}

/**
 * Creates CSV export success response
 * @param {Object} exportData - Export data and context
 * @param {Array} exportData.steps - Processing steps
 * @param {Object} exportData.storageResult - Storage operation result
 * @param {Object} exportData.meshData - Mesh response data
 * @param {Object} exportData.trace - Trace context
 * @returns {Object} CSV export response
 */
function createCsvExportResponse(exportData) {
  const { steps, storageResult, meshData, trace } = exportData;
  const endTime = Date.now();
  const totalDuration = endTime - trace.startTime;

  return shared.success(
    {
      message: 'Product export completed successfully',
      steps,
      downloadUrl: storageResult.downloadUrl,
      storage: {
        provider: storageResult.storageType,
        location: storageResult.location || storageResult.fileName,
        properties: storageResult.properties,
      },
      performance: {
        // Include mesh performance metrics
        ...meshData.performance,
        // Add total duration
        duration: totalDuration,
        durationFormatted: `${(totalDuration / 1000).toFixed(1)}s`,
        // Override method to ensure consistency
        method: 'API Mesh',
      },
    },
    'Product export completed',
    {}
  );
}

module.exports = {
  createJsonResponse,
  createCsvExportResponse,
};
