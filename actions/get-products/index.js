/**
 * Product Export Action
 * Business capability: Export Adobe Commerce product data as CSV using REST API
 */

const { exportProductsWithStorageAndFallback } = require('../../src/products/rest-export');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * Product export business logic
 * @purpose Execute complete product export workflow with REST API integration
 * @param {Object} context - Initialized action context with config and parameters
 * @returns {Promise<Object>} Export result with CSV data and metadata
 * @usedBy Adobe App Builder frontend, external API consumers
 * @config commerce.baseUrl, commerce.credentials, storage.provider, products.fields
 */
async function getProductsBusinessLogic(context) {
  const { core, config, extractedParams } = context;

  // Step 1: Execute complete product export workflow with storage and fallback
  const exportResult = await exportProductsWithStorageAndFallback(extractedParams, config, core);

  // Step 2: Return export result with success message
  return {
    message: 'Product export completed successfully',
    steps: [core.formatStepMessage('product-export', 'success', 'CSV generated and stored')],
    ...exportResult,
  };
}

module.exports = createAction(getProductsBusinessLogic, {
  actionName: 'get-products',
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV',
});
