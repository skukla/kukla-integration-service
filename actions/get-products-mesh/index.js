/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */

const { createAction } = require('../../src/core');
const { exportCsvWithStorage } = require('../../src/files/workflows/file-management');
const { createCsv } = require('../../src/products/utils/csv');
const { exportProductsViaMesh } = require('../../src/products/workflows/mesh-export');

/**
 * Business logic for get-products-mesh action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Action response
 */
async function getProductsMeshBusinessLogic(context) {
  const { extractedParams, webActionParams, config, trace, core } = context;

  // Merge parameters for format detection
  const allActionParams = { ...webActionParams, ...extractedParams };
  const format = allActionParams.format || 'csv';

  // Step 1-3: Export products via mesh using domain workflow
  const { meshData, builtProducts } = await exportProductsViaMesh(extractedParams, config, trace);

  // Branch based on requested format
  if (format === 'json') {
    // Return JSON response with product data
    return core.success(
      {
        products: builtProducts,
        total_count: builtProducts.length,
        performance: meshData.performance,
      },
      'Product data retrieved successfully via API Mesh',
      {}
    );
  }

  // Step 4: Generate CSV from built products
  const csvResult = await createCsv(builtProducts, config);

  // Step 5: Store CSV using file workflow
  const exportResult = await exportCsvWithStorage(csvResult.content, config, extractedParams);

  // Calculate total duration for performance metrics
  const endTime = Date.now();
  const totalDuration = endTime - trace.startTime;

  // Return CSV export response with performance metrics
  return core.success(
    {
      message: 'Product export completed successfully',
      downloadUrl: exportResult.downloadUrl,
      performance: {
        // Include mesh performance metrics
        ...meshData.performance,
        // Add total duration
        duration: totalDuration,
        durationFormatted: `${(totalDuration / 1000).toFixed(1)}s`,
        // Override method to ensure consistency
        method: 'API Mesh',
      },
      storage: exportResult.storage,
    },
    'Product export completed via API Mesh',
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
