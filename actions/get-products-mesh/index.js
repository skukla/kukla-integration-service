/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 * @updated Force redeploy to fix errorResponse bug
 */

const { createAction } = require('../../src/core');
const { exportCsvWithStorage } = require('../../src/files/workflows/file-management');
const { exportMeshProducts } = require('../../src/products/workflows/mesh-export');

/**
 * Business logic for get-products-mesh action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Action response
 */
async function getProductsMeshBusinessLogic(context) {
  const { extractedParams, webActionParams, config, trace, core } = context;
  const steps = [];

  // Merge parameters for format detection
  const allActionParams = { ...webActionParams, ...extractedParams };
  const format = allActionParams.format || 'csv';

  // Step 1: Validate mesh configuration and credentials
  steps.push(core.formatStepMessage('validate-mesh', 'success'));

  // Step 2-4: Export products via mesh
  const includeCSV = format !== 'json';
  const exportResult = await exportMeshProducts(extractedParams, config, trace, includeCSV);
  const { meshData, builtProducts, csvData, productCount } = exportResult;

  // Step 2: Fetch products from mesh
  steps.push(core.formatStepMessage('fetch-mesh', 'success', { count: productCount }));

  // Step 3: Transform products
  steps.push(core.formatStepMessage('build-products', 'success', { count: productCount }));

  // Branch based on requested format
  if (format === 'json') {
    // Return JSON response with product data
    return core.success(
      {
        products: builtProducts,
        total_count: productCount,
        performance: meshData.performance || { method: 'API Mesh (No Data)', processedProducts: 0 },
        steps,
        // Include debug information from mesh response
        ...(meshData.debug && { meshDebug: meshData.debug }),
      },
      'Product data retrieved successfully via API Mesh',
      {}
    );
  }

  // Step 4: Generate CSV
  steps.push(core.formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize }));

  // Step 5: Store CSV using file workflow
  const storageResult = await exportCsvWithStorage(csvData.content, config, extractedParams);
  steps.push(core.formatStepMessage('store-csv', 'success', { info: storageResult }));

  // Calculate total duration for performance metrics
  const endTime = Date.now();
  const totalDuration = endTime - trace.startTime;

  // Return CSV export response with performance metrics
  return core.success(
    {
      steps,
      downloadUrl: storageResult.downloadUrl,
      performance: {
        // Include mesh performance metrics
        ...(meshData.performance || { method: 'API Mesh (No Data)', processedProducts: 0 }),
        // Add total duration
        duration: totalDuration,
        durationFormatted: `${(totalDuration / 1000).toFixed(1)}s`,
        // Override method to ensure consistency
        method: 'API Mesh',
      },
      storage: storageResult.storage,
      // Include debug information from mesh response
      ...(meshData.debug && { meshDebug: meshData.debug }),
    },
    'Product export completed successfully',
    {}
  );
}

// Create action with framework - clean orchestrator pattern using domain workflows!
module.exports = createAction(getProductsMeshBusinessLogic, {
  actionName: 'get-products-mesh',
  domains: ['products', 'files'],
  withTracing: true, // Mesh actions need performance tracing
  withLogger: false,
  description: 'Export Adobe Commerce product data via API Mesh to CSV using domain workflows',
});
