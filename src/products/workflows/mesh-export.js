/**
 * API Mesh Export Workflow
 *
 * High-level orchestration for mesh-based product export.
 * Consolidates the mesh data fetching and processing pipeline.
 */

const {
  fetchEnrichedProductsFromMesh,
  validateMeshInput,
} = require('../operations/mesh-integration');
const { buildProducts } = require('../operations/transformation');
const { createCsv } = require('../utils/csv');

/**
 * Complete mesh-based product export workflow
 *
 * Orchestrates the full process from mesh fetching to product building.
 * This workflow handles the mesh-specific data pipeline.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} trace - Trace context for performance monitoring
 * @returns {Promise<Object>} Export result with mesh data and built products
 */
async function exportProductsViaMesh(params, config, trace = null) {
  // Step 1: Validate mesh configuration
  await validateMeshInput(params, config);

  // Step 2: Fetch enriched products from mesh
  const meshData = await fetchEnrichedProductsFromMesh(config, params, trace);

  // Sort products by SKU for consistent output
  meshData.products.sort((a, b) => a.sku.localeCompare(b.sku));

  // Step 3: Build product data using shared transformation
  const builtProducts = await buildProducts(meshData.products, config);

  return {
    meshData,
    builtProducts,
    productCount: builtProducts.length,
    totalCount: meshData.total_count,
  };
}

/**
 * Complete mesh export with CSV generation
 *
 * Full workflow that includes CSV generation from mesh data.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} trace - Trace context for performance monitoring
 * @returns {Promise<Object>} Export result with CSV data
 */
async function exportMeshProductsToCsv(params, config, trace = null) {
  // Step 1-3: Export products via mesh
  const exportResult = await exportProductsViaMesh(params, config, trace);

  // Step 4: Generate CSV from built products
  const csvResult = await createCsv(exportResult.builtProducts, config);

  return {
    ...exportResult,
    csvData: csvResult,
    csvSize: csvResult.stats.originalSize,
  };
}

module.exports = {
  exportProductsViaMesh,
  exportMeshProductsToCsv,
};
