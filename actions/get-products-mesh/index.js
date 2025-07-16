/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { storeCsvFile } = require('../../src/files/workflows/file-management');
const { buildProductExportResponse } = require('../../src/products/operations/response-building');
const { exportMeshProducts } = require('../../src/products/workflows/mesh-export');

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

  try {
    // Step 2: Execute mesh export workflow (fetching, transformation, CSV generation)
    const exportResult = await exportMeshProducts(extractedParams, config);

    steps.push(
      core.formatStepMessage('fetch-mesh', 'success', { count: exportResult.productCount })
    );
    steps.push(
      core.formatStepMessage('build-products', 'success', { count: exportResult.productCount })
    );
    steps.push(core.formatStepMessage('create-csv', 'success', { size: exportResult.csvSize }));

    // Step 3: Store CSV file using the same approach as get-products
    const storageResult = await storeCsvFile(
      exportResult.csvData,
      config,
      extractedParams,
      undefined,
      {
        useCase: extractedParams.useCase,
      }
    );

    if (!storageResult.stored) {
      throw new Error(
        `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`
      );
    }

    steps.push(
      core.formatStepMessage('store-csv', 'success', { provider: storageResult.provider })
    );

    // Build response using the same pattern as get-products
    const workflowResult = {
      success: true,
      exportResult,
      storageResult,
      steps,
      fallback: false,
    };

    return buildProductExportResponse(workflowResult);
  } catch (error) {
    steps.push(core.formatStepMessage('error', 'error', { message: error.message }));
    throw error;
  }
}

// Export the action with proper configuration
module.exports = createAction(getProductsMeshBusinessLogic, {
  actionName: 'get-products-mesh',
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV using API Mesh',
});
