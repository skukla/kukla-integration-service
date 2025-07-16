/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { buildProductExportResponse } = require('../../src/products/operations/response-building');
const {
  exportProductsWithStorageAndFallback,
} = require('../../src/products/workflows/rest-export');

/**
 * Business logic for get-products action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function getProductsBusinessLogic(context) {
  const { core, config, extractedParams } = context;
  const steps = [];

  // Step 1: Input has been validated in the action factory
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Execute the complete product export workflow
  const workflowResult = await exportProductsWithStorageAndFallback(extractedParams, config, core);

  // Step 3: Combine validation step with workflow steps
  workflowResult.steps = [...steps, ...workflowResult.steps];

  // Step 4: Build appropriate response based on workflow result
  return buildProductExportResponse(workflowResult);
}

// Export the action with proper configuration
module.exports = createAction(getProductsBusinessLogic, {
  actionName: 'get-products',
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV',
});
