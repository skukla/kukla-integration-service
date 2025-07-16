/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { buildProductExportResponse } = require('../../src/products/operations/response-building');
const {
  exportMeshProductsWithStorageAndFallback,
} = require('../../src/products/workflows/mesh-export');

/**
 * Business logic for get-products-mesh action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function getProductsMeshBusinessLogic(context) {
  const { core, config, extractedParams } = context;
  const steps = [];

  // Step 1: Input has been validated in the action factory
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Execute the complete mesh product export workflow (mirrors get-products pattern)
  const workflowResult = await exportMeshProductsWithStorageAndFallback(
    extractedParams,
    config,
    core
  );

  // Step 3: Combine validation step with workflow steps
  workflowResult.steps = [...steps, ...workflowResult.steps];

  // Step 4: Build response using the same pattern as get-products
  return buildProductExportResponse(workflowResult);
}

// Export the action with proper configuration
module.exports = createAction(getProductsMeshBusinessLogic, {
  actionName: 'get-products-mesh',
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV using API Mesh',
});
