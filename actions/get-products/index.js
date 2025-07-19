/**
 * Product Export Action
 * Business capability: Export Adobe Commerce product data as CSV using REST API
 */

const { exportProductsWithStorageAndFallback } = require('../../src/products/rest-export');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * Export products via REST API workflow
 * @purpose Orchestrate complete product export via Commerce REST API with CSV generation and storage
 * @param {Object} context - Action execution context with config and extracted parameters
 * @returns {Promise<Object>} Product export response with download URL and storage metadata
 * @usedBy get-products action via createAction framework
 */
async function getProductsBusinessLogic(context) {
  const { config, extractedParams } = context;

  return await exportProductsWithStorageAndFallback(extractedParams, config);
}

module.exports = createAction(getProductsBusinessLogic, {
  actionName: 'get-products',
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV',
});
