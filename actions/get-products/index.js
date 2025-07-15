/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */

// Use direct import from action factory operation - DDD compliant
const { createAction } = require('../../src/core/action/operations/action-factory');

/**
 * Business logic for get-products action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Response object
 */
async function getProductsBusinessLogic(context) {
  const { products, files, core, config, extractedParams } = context;
  const steps = [];

  // Step 1: Validate input
  steps.push(core.formatStepMessage('validate-input', 'success'));

  // Step 2: Fetch and enrich products using domain functions
  const productData = await products.fetchAndEnrichProducts(extractedParams, config);
  steps.push(core.formatStepMessage('fetch-and-enrich', 'success', { count: productData.length }));

  // Step 3: Build products with proper transformation
  const builtProducts = await products.buildProducts(productData, config);
  steps.push(core.formatStepMessage('build-products', 'success', { count: builtProducts.length }));

  // Step 4: Create CSV
  const csvData = await products.createCsv(builtProducts, config);
  steps.push(core.formatStepMessage('create-csv', 'success', { size: csvData.length }));

  // Step 5: Store CSV using files domain
  const storageResult = await files.storeCsv(csvData, extractedParams);

  if (!storageResult.stored) {
    throw new Error(
      `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`
    );
  }

  steps.push(core.formatStepMessage('store-csv', 'success', { location: storageResult.location }));

  return core.success(
    {
      message: 'Product export completed successfully',
      downloadUrl: storageResult.downloadUrl,
      steps,
      storage: storageResult.storage,
    },
    'Product export completed successfully',
    {}
  );
}

// Create action with framework - all boilerplate eliminated!
module.exports = createAction(getProductsBusinessLogic, {
  actionName: 'get-products',
  domains: ['products', 'files'],
  withTracing: false,
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV',
});
