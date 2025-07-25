/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { storeCsvFile } = require('../../src/files/workflows/file-management');
const { fetchEnrichedProductsFromMesh } = require('../../src/products/operations/mesh-integration');
const { buildProducts } = require('../../src/products/operations/transformation');
const { createCsv } = require('../../src/products/utils/csv');

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

  // Step 2: Fetch products from API Mesh
  const meshData = await fetchEnrichedProductsFromMesh(config, extractedParams);
  steps.push(core.formatStepMessage('fetch-mesh', 'success', { count: meshData.products.length }));

  // Step 3: Build products with proper transformation
  const builtProducts = await buildProducts(meshData.products, config);
  steps.push(core.formatStepMessage('build-products', 'success', { count: builtProducts.length }));

  // Step 4: Create CSV
  const csvData = await createCsv(builtProducts, config);
  steps.push(core.formatStepMessage('create-csv', 'success', { size: csvData.content.length }));

  // Step 5: Store CSV file
  const storageResult = await storeCsvFile(csvData.content, config, extractedParams, undefined, {
    useCase: extractedParams.useCase,
  });
  if (!storageResult.stored) {
    throw new Error(
      `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`
    );
  }
  steps.push(core.formatStepMessage('store-csv', 'success', { provider: storageResult.provider }));

  return {
    message: 'Mesh product export completed successfully',
    steps,
    downloadUrl: storageResult.downloadUrl,
    storage: {
      provider: storageResult.provider,
      location: storageResult.fileName,
      properties: storageResult.properties,
      management: storageResult.management,
    },
    performance: meshData.performance,
  };
}

// Export the action with proper configuration
module.exports = createAction(getProductsMeshBusinessLogic, {
  actionName: 'get-products-mesh',
  withTracing: false,
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV using API Mesh',
});
