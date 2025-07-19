/**
 * Product Mesh Export Action
 * Business capability: Export Adobe Commerce product data as CSV using API Mesh
 */

const { exportMeshProductsWithStorageAndFallback } = require('../../src/products/mesh-export');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * Product mesh export business logic
 * @purpose Execute complete product export workflow with API Mesh integration
 * @param {Object} context - Initialized action context with config and parameters
 * @returns {Promise<Object>} Export result with CSV data and metadata
 * @usedBy Adobe App Builder frontend, external API consumers
 * @config mesh.endpoint, mesh.apiKey, commerce.credentials, storage.provider, products.fields
 */
async function getProductsMeshBusinessLogic(context) {
  const { core, config, extractedParams } = context;

  // Step 1: Execute complete mesh product export workflow with storage and fallback
  const exportResult = await exportMeshProductsWithStorageAndFallback(
    extractedParams,
    config,
    core
  );

  // Step 2: Return export result with success message
  return {
    message: 'Product export completed successfully',
    steps: [
      core.formatStepMessage('mesh-export', 'success', 'CSV generated via API Mesh and stored'),
    ],
    ...exportResult,
  };
}

module.exports = createAction(getProductsMeshBusinessLogic, {
  actionName: 'get-products-mesh',
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV using API Mesh',
});
