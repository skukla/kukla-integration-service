/**
 * Response formatters for get-products-mesh action
 * @module get-products-mesh/lib/formatters
 */

/**
 * Creates JSON response for API Mesh integration
 * @param {Object} builtProducts - Built product data
 * @param {Object} meshData - Mesh response data
 * @param {Array} steps - Processing steps
 * @param {Object} core - Core utilities
 * @returns {Object} JSON response
 */
function createJsonResponse(builtProducts, meshData, steps, core) {
  return core.success(
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
 * Creates CSV export success response with performance metrics
 * @param {Object} exportData - Export data and context
 * @param {Object} core - Core utilities
 * @returns {Object} CSV export response
 */
function createCsvExportResponse(exportData, core) {
  const { steps, storageResult, meshData, trace } = exportData;
  const endTime = Date.now();
  const totalDuration = endTime - trace.startTime;

  return core.success(
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
