/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */

// Use domain catalogs for thin orchestrator pattern
const { loadConfig } = require('../../../config');
const { products, files, shared } = require('../../../src');

/**
 * Main function for get-products action
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Response object
 */
async function main(params) {
  try {
    // Extract action parameters and load configuration
    const actionParams = shared.extractActionParams(params);
    const config = loadConfig(actionParams);

    const steps = [];

    // Step 1: Validate input
    steps.push(shared.formatStepMessage('validate-input', 'success'));

    // Step 2: Fetch and enrich products using domain functions
    const productData = await products.fetchAndEnrichProducts(actionParams, config);
    steps.push(
      shared.formatStepMessage('fetch-and-enrich', 'success', { count: productData.length })
    );

    // Step 3: Build products with proper transformation
    const builtProducts = await products.buildProducts(productData, config);
    steps.push(
      shared.formatStepMessage('build-products', 'success', { count: builtProducts.length })
    );

    // Step 4: Create CSV
    const csvData = await products.createCsv(builtProducts, config);
    steps.push(
      shared.formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize })
    );

    // Step 5: Store CSV using files domain
    const storageResult = await files.storeCsv(csvData.content, config, actionParams);
    steps.push(shared.formatStepMessage('store-csv', 'success', { info: storageResult }));

    // Return success response using shared utilities
    return shared.success(
      {
        steps,
        storage: storageResult,
        downloadUrl: storageResult.downloadUrl,
      },
      'Product export completed successfully',
      {}
    );
  } catch (error) {
    console.error('Error:', error);
    // Use shared error handling
    return shared.error(error, {});
  }
}

module.exports = { main };
