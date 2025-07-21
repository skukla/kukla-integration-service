/**
 * Product Export Action
 * Business capability: Export Adobe Commerce product data as CSV using REST API
 */

const { exportProductsWithStorage } = require('../../src/products/rest-export');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * Export products via REST API workflow
 * @purpose Orchestrate complete product export via Commerce REST API with CSV generation and storage
 * @param {Object} context - Action execution context with config and extracted parameters
 * @returns {Promise<Object>} Product export response with download URL and storage metadata
 * @usedBy get-products action via createAction framework
 */
async function getProductsBusinessLogic(context) {
  const { config, extractedParams, response } = context;
  const steps = [];

  try {
    // Step 1: Input validation (already done by action factory)
    steps.push('Successfully validated Commerce API credentials and URL');

    // Step 2-5: Execute DDD export workflow and collect results
    const exportResult = await exportProductsWithStorage(extractedParams, config);

    // Step 6: Parse the CSV export response body to get download URLs
    const csvExportData = JSON.parse(exportResult.storageResult.body);

    // Step 7: Add outputsteps
    steps.push(
      `Successfully fetched and enriched ${exportResult.productCount} products with category and inventory data`
    );
    steps.push(`Successfully transformed ${exportResult.productCount} products for export`);
    steps.push(`Successfully generated CSV file (${(exportResult.csvSize / 1024).toFixed(2)} KB)`);
    steps.push('Successfully stored CSV file');

    const responseData = {
      steps,
      productCount: exportResult.productCount,
      csvSize: exportResult.csvSize,
      storage: exportResult.storageResult.provider,
      fileName: csvExportData.fileName,
      downloadUrls: {
        action: csvExportData.downloadUrls?.action || csvExportData.actionDownloadUrl,
        presigned: csvExportData.downloadUrls?.presigned || csvExportData.presignedUrl,
        expiryHours: csvExportData.downloadUrls?.expiryHours || csvExportData.expiryHours || 24,
      },
    };

    return response.success(responseData, 'Product export completed successfully');
  } catch (error) {
    steps.push(`Error occurred: ${error.message}`);
    throw error;
  }
}

module.exports = createAction(getProductsBusinessLogic, {
  actionName: 'get-products',
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV',
});
