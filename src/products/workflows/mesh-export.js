/**
 * Products Mesh Export Workflows
 *
 * Product export workflows using API Mesh GraphQL
 */

const { storeCsvFile } = require('../../files/operations/storage-operations');
const { fetchEnrichedProductsFromMesh } = require('../operations/mesh-integration');
const { sortProductsBySku } = require('../operations/sorting');
const { buildProducts } = require('../operations/transformation');
const { validateMeshInput } = require('../operations/validation');
const { convertToCSV } = require('../utils/csv');

// === EXPORT WORKFLOWS ===

/**
 * Complete mesh-based product export workflow with CSV generation
 * Used by: exportMeshProductsWithStorageAndFallback function
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} [trace=null] - Trace context for performance monitoring
 * @param {boolean} [includeCSV=true] - Whether to generate CSV data
 * @returns {Promise<Object>} Export result with mesh data, built products, and optionally CSV
 */
async function exportMeshProducts(params, config, trace = null, includeCSV = true) {
  // Step 1: Validate mesh configuration and parameters
  await validateMeshInput(params, config);

  // Step 2: Fetch enriched products from API Mesh
  const meshData = await fetchEnrichedProductsFromMesh(config, params, trace);

  // Step 3: Sort products and transform for export format
  meshData.products = sortProductsBySku(meshData.products);
  const builtProducts = await buildProducts(meshData.products, config);

  const result = {
    meshData,
    builtProducts,
    productCount: builtProducts.length,
    totalCount: meshData.total_count,
  };

  // Step 4: Generate CSV if requested
  if (includeCSV) {
    const csvResult = await convertToCSV(builtProducts, config);
    result.csvContent = csvResult;
    result.csvSize = csvResult.length;
  }

  return result;
}

/**
 * Complete mesh product export workflow with storage and error handling
 * Used by: get-products-mesh action
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} core - Core utilities for step messaging
 * @param {Object} [trace=null] - Trace context
 * @returns {Promise<Object>} Complete export result with storage info and steps
 */
async function exportMeshProductsWithStorageAndFallback(params, config, core, trace = null) {
  const steps = [];

  try {
    // Step 1: Execute complete mesh product export workflow
    const exportResult = await exportMeshProducts(params, config, trace);

    steps.push(
      core.formatStepMessage('fetch-mesh', 'success', { count: exportResult.productCount })
    );

    steps.push(
      core.formatStepMessage('build-products', 'success', { count: exportResult.productCount })
    );

    steps.push(core.formatStepMessage('create-csv', 'success', { size: exportResult.csvSize }));

    // Step 2: Store CSV file with error handling
    let storageResult;
    try {
      storageResult = await storeCsvFile(exportResult.csvContent, config, params, undefined, {
        useCase: params.useCase,
      });

      steps.push(
        core.formatStepMessage('store-csv', 'success', {
          provider: storageResult.provider,
          fileName: storageResult.fileName,
        })
      );

      return {
        success: true,
        exportResult,
        storageResult,
        steps,
        fallback: false,
      };
    } catch (storageError) {
      steps.push(
        core.formatStepMessage('store-csv', 'warning', {
          message: `Storage failed: ${storageError.message}`,
        })
      );

      return {
        success: true,
        exportResult,
        storageError,
        steps,
        fallback: true,
      };
    }
  } catch (error) {
    steps.push(core.formatStepMessage('error', 'error', { message: error.message }));
    throw error;
  }
}

module.exports = {
  // Main export workflows
  exportMeshProducts,
  exportMeshProductsWithStorageAndFallback,
};
