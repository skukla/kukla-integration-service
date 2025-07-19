/**
 * Product Export Action
 * Business capability: Export Adobe Commerce product data as CSV using REST API
 * Version: Fixed circular dependency, HTTP client, and query building issues
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
  const { config, extractedParams, core } = context;
  const steps = [];

  try {
    // Step 1: Input validation (already done by action factory)
    steps.push(core.formatStepMessage('validate-input', 'success'));

    // Step 2-5: Execute DDD export workflow and collect results
    const exportResult = await exportProductsWithStorageAndFallback(extractedParams, config);

    // Extract the storage result to build proper response
    const storageResult = exportResult.storageResult;
    const productCount = exportResult.productCount;
    const csvSize = exportResult.csvSize;

    // Step 2: Fetch and enrich (simulated from our export result)
    steps.push(core.formatStepMessage('fetch-and-enrich', 'success', { count: productCount }));

    // Step 3: Build products (simulated from our export result)
    steps.push(core.formatStepMessage('build-products', 'success', { count: productCount }));

    // Step 4: Create CSV (simulated from our export result)
    steps.push(core.formatStepMessage('create-csv', 'success', { size: csvSize }));

    // Step 5: Store CSV (using actual storage result)
    steps.push(
      core.formatStepMessage('store-csv', 'success', {
        provider: storageResult.storage || config.storage.provider,
      })
    );

    return {
      message: 'Product export completed successfully',
      steps,
      downloadUrl: storageResult.downloadUrl,
      storage: {
        provider: storageResult.storage || config.storage.provider,
        location: storageResult.fileName,
        properties: storageResult.properties || {},
        management: storageResult.management || {},
      },
      performance: {
        productCount: productCount,
        csvSize: csvSize,
        storage: storageResult.storage || config.storage.provider,
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
