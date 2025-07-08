/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */

// Use action framework to eliminate duplication
const { createJsonResponse, createCsvExportResponse } = require('./lib/formatters');
const { executeMeshDataSteps, executeCsvSteps } = require('./lib/steps');
const { createAction } = require('../../../src/core');
// Import action-specific helpers

/**
 * Business logic for get-products-mesh action
 * @param {Object} context - Initialized action context
 * @returns {Promise<Object>} Action response
 */
async function getProductsMeshBusinessLogic(context) {
  const { core, params, originalParams } = context;

  // Check format parameter to determine response type
  const allParams = { ...originalParams, ...params };
  const format = allParams.format || 'csv';

  // Step 1-3: Execute mesh data processing
  const { steps, meshData, builtProducts } = await executeMeshDataSteps(context);

  // Branch based on requested format
  if (format === 'json') {
    // Return JSON response with product data
    return createJsonResponse(builtProducts, meshData, steps, core);
  }

  // Step 4-5: Execute CSV processing and storage
  const { storageResult } = await executeCsvSteps(builtProducts, {
    ...context,
    steps, // Pass accumulated steps
  });

  // Return CSV export response with performance metrics
  const exportData = { steps, storageResult, meshData, trace: context.trace };
  return createCsvExportResponse(exportData, core);
}

// Create action with framework - clean orchestrator pattern!
module.exports = createAction(getProductsMeshBusinessLogic, {
  actionName: 'get-products-mesh',
  domains: ['products', 'files'],
  withTracing: true, // Mesh actions need performance tracing
  withLogger: false,
  description: 'Export Adobe Commerce product data via API Mesh to CSV',
});
