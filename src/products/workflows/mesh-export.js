/**
 * API Mesh Export Workflow
 *
 * High-level orchestration for mesh-based product export.
 * Consolidates the mesh data fetching and processing pipeline.
 */

const { storeCsvFile } = require('../../files/workflows/file-management');
const { fetchEnrichedProductsFromMesh } = require('../operations/mesh-integration');
const { sortProductsBySku } = require('../operations/sorting');
const { buildProducts } = require('../operations/transformation');
const { validateMeshInput } = require('../operations/validation');
const { convertToCSV } = require('../utils/csv');

/**
 * Complete mesh-based product export workflow with CSV generation
 *
 * Orchestrates the full process from mesh fetching to CSV generation.
 * This workflow handles the complete mesh-specific data pipeline.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} trace - Trace context for performance monitoring
 * @param {boolean} [includeCSV=true] - Whether to generate CSV data
 * @returns {Promise<Object>} Export result with mesh data, built products, and optionally CSV
 */
async function exportMeshProducts(params, config, trace = null, includeCSV = true) {
  // Step 1: Validate mesh configuration and credentials
  await validateMeshInput(params, config);

  // Step 2: Fetch enriched products from mesh
  const meshData = await fetchEnrichedProductsFromMesh(config, params, trace);

  // Step 3: Sort products by SKU for consistent output
  meshData.products = sortProductsBySku(meshData.products);

  // Step 4: Build product data using shared transformation
  const builtProducts = await buildProducts(meshData.products, config);

  // Base result object
  const result = {
    meshData,
    builtProducts,
    productCount: builtProducts.length,
    totalCount: meshData.total_count,
  };

  // Step 5: Generate CSV if requested
  if (includeCSV) {
    const csvResult = await convertToCSV(builtProducts, config);
    result.csvContent = csvResult;
    result.csvSize = csvResult.length;
  }

  return result;
}

/**
 * Complete mesh product export workflow with storage and comprehensive error handling
 *
 * Full workflow that includes storage with fallback handling for when storage fails.
 * Mirrors the pattern of exportProductsWithStorageAndFallback for mesh data.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} core - Core utilities for step messaging
 * @param {Object} trace - Trace context
 * @returns {Promise<Object>} Complete export result with storage info and steps
 */
async function exportMeshProductsWithStorageAndFallback(params, config, core, trace = null) {
  const steps = [];

  try {
    // Step 1: Export mesh products to CSV
    const exportResult = await exportMeshProducts(params, config, trace);

    steps.push(
      core.formatStepMessage('fetch-mesh', 'success', { count: exportResult.productCount })
    );

    steps.push(
      core.formatStepMessage('build-products', 'success', { count: exportResult.productCount })
    );

    steps.push(core.formatStepMessage('create-csv', 'success', { size: exportResult.csvSize }));

    // Step 2: Attempt storage
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

      // Return successful storage result
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

      // Return fallback result with CSV content
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
  exportMeshProducts,
  exportMeshProductsWithStorageAndFallback,
};
