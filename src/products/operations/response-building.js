/**
 * Products Domain Response Building Operations
 *
 * Specialized response builders for product export workflows.
 * These functions create standardized responses for different export scenarios.
 */

const { response } = require('../../core/http/responses');

/**
 * Build successful product export response with storage
 *
 * @param {Object} workflowResult - Result from exportProductsWithStorageAndFallback
 * @returns {Object} Standardized success response
 */
function buildProductExportSuccessResponse(workflowResult) {
  const { exportResult, storageResult, steps } = workflowResult;

  return response.success({
    message: 'Product export completed successfully',
    steps,
    downloadUrl: storageResult.downloadUrl || null,
    storage: {
      provider: 'app-builder',
      location: storageResult.fileName || null,
      properties: storageResult.properties || {},
      downloadUrl: storageResult.downloadUrl || null,
      presignedUrl: storageResult.presignedUrl || null,
    },
    performance: {
      productCount: exportResult.productCount,
      csvSize: exportResult.csvSize,
      storage: 'app-builder',
    },
  });
}

/**
 * Build fallback product export response when storage fails
 *
 * @param {Object} workflowResult - Result from exportProductsWithStorageAndFallback
 * @returns {Object} Standardized fallback response
 */
function buildProductExportFallbackResponse(workflowResult) {
  const { exportResult, storageError, steps } = workflowResult;

  return response.success({
    message: 'Products exported successfully (storage unavailable - returning CSV content)',
    steps,
    csvContent:
      exportResult.csvContent.substring(0, 1000) +
      (exportResult.csvContent.length > 1000 ? '...' : ''),
    csvSize: exportResult.csvSize,
    productCount: exportResult.productCount,
    downloadUrl: null,
    storage: {
      provider: 'unavailable',
      error: storageError.message,
    },
    performance: {
      productCount: exportResult.productCount,
      csvSize: exportResult.csvSize,
    },
  });
}

/**
 * Build product export response based on workflow result
 *
 * @param {Object} workflowResult - Result from exportProductsWithStorageAndFallback
 * @returns {Object} Appropriate response based on success/fallback status
 */
function buildProductExportResponse(workflowResult) {
  if (workflowResult.fallback) {
    return buildProductExportFallbackResponse(workflowResult);
  }
  return buildProductExportSuccessResponse(workflowResult);
}

module.exports = {
  buildProductExportSuccessResponse,
  buildProductExportFallbackResponse,
  buildProductExportResponse,
};
