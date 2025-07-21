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
  const { config, extractedParams, core } = context;
  const steps = [];

  try {
    // Step 1: Input validation (already done by action factory)
    steps.push(core.formatStepMessage('validate-input', 'success'));

    // Step 2-5: Execute DDD export workflow and collect results
    const exportResult = await exportProductsWithStorage(extractedParams, config);

    // Parse the CSV export response body to get download URLs
    const csvExportData = JSON.parse(exportResult.storageResult.body);

    // Add steps for the workflow
    steps.push(
      core.formatStepMessage('fetch-and-enrich', 'success', { count: exportResult.productCount })
    );
    steps.push(
      core.formatStepMessage('build-products', 'success', { count: exportResult.productCount })
    );
    steps.push(core.formatStepMessage('create-csv', 'success', { size: exportResult.csvSize }));
    steps.push(core.formatStepMessage('store-csv', 'success', { provider: csvExportData.storage }));

    return {
      message: 'Product export completed successfully',
      steps,
      downloadUrls: csvExportData.downloadUrls,
      storage: {
        provider: csvExportData.storage,
        location: csvExportData.fileName,
      },
      performance: {
        productCount: exportResult.productCount,
        csvSize: exportResult.csvSize,
        storage: csvExportData.storage,
      },
    };
  } catch (error) {
    steps.push(core.formatStepMessage('error', 'error', { message: error.message }));
    throw error;
  }
}

module.exports = createAction(getProductsBusinessLogic, {
  actionName: 'get-products',
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV',
});
