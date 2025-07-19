/**
 * Get Products Mesh Action
 * Business capability: Export product data as CSV using API Mesh with storage
 */

const { exportMeshProductsWithStorageAndFallback } = require('../../src/products/mesh-export');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * Export products via API Mesh workflow
 * @purpose Orchestrate complete product export via API Mesh with GraphQL queries and CSV generation
 * @param {Object} context - Action execution context with config and extracted parameters
 * @returns {Promise<Object>} Product export response with download URL and storage metadata
 * @usedBy get-products-mesh action via createAction framework
 */
async function getProductsMeshBusinessLogic(context) {
  const { config, extractedParams } = context;

  return await exportMeshProductsWithStorageAndFallback(extractedParams, config);
}

module.exports = createAction(getProductsMeshBusinessLogic, {
  actionName: 'get-products-mesh',
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV using API Mesh',
});
