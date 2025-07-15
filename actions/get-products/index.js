/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */

const { createAction } = require('../../src/core/action/operations/action-factory');
const { storeCsvFile } = require('../../src/files/workflows/file-management');
const { fetchAndEnrichProducts } = require('../../src/products/operations/enrichment');
const { buildProducts } = require('../../src/products/operations/transformation');
const { createCsv } = require('../../src/products/utils/csv');

console.log('DIAGNOSTIC: Starting get-products action module load');
console.log('DIAGNOSTIC: Action factory loaded successfully');
console.log('DIAGNOSTIC: Storage workflow loaded successfully');
console.log('DIAGNOSTIC: Enrichment operations loaded successfully');
console.log('DIAGNOSTIC: Transformation operations loaded successfully');
console.log('DIAGNOSTIC: CSV utils loaded successfully');

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

  try {
    // Test admin token generation first
    const { getAuthToken } = require('../../src/commerce/utils/admin-auth');
    const adminToken = await getAuthToken(extractedParams, config);
    steps.push(
      core.formatStepMessage('admin-token', 'success', { tokenLength: adminToken.length })
    );

    // Step 2: Fetch and enrich products using domain functions
    const productData = await fetchAndEnrichProducts(extractedParams, config);
    steps.push(
      core.formatStepMessage('fetch-and-enrich', 'success', { count: productData.length })
    );

    // Step 3: Build products with proper transformation
    const builtProducts = await buildProducts(productData, config);
    steps.push(
      core.formatStepMessage('build-products', 'success', { count: builtProducts.length })
    );

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

    steps.push(
      core.formatStepMessage('store-csv', 'success', { provider: storageResult.provider })
    );

    return {
      message: 'Product export completed successfully',
      steps,
      downloadUrl: storageResult.downloadUrl,
      storage: {
        provider: storageResult.provider,
        location: storageResult.fileName,
        properties: storageResult.properties,
      },
      performance: {
        productCount: builtProducts.length,
        csvSize: csvData.content.length,
        storage: storageResult.provider,
      },
    };
  } catch (error) {
    steps.push(core.formatStepMessage('error', 'error', { message: error.message }));
    throw error;
  }
}

console.log('DIAGNOSTIC: About to create action export');

// Export the action with proper configuration
module.exports = createAction(getProductsBusinessLogic, {
  actionName: 'get-products',
  withTracing: false,
  withLogger: false,
  description: 'Export Adobe Commerce product data to CSV',
});

console.log('DIAGNOSTIC: Action export created successfully');
