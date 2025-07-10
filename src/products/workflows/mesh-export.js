/**
 * API Mesh Export Workflow
 *
 * High-level orchestration for mesh-based product export.
 * Consolidates the mesh data fetching and processing pipeline.
 */

const { fetchEnrichedProductsFromMesh } = require('../operations/mesh-integration');
const { buildProducts } = require('../operations/transformation');
const { createCsv } = require('../utils/csv');

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
  // Step 1: Fetch enriched products from mesh (validation handled internally)
  const meshData = await fetchEnrichedProductsFromMesh(config, params, trace);

  // Sort products by SKU for consistent output
  meshData.products.sort((a, b) => a.sku.localeCompare(b.sku));

  // Step 2: Build product data using shared transformation
  const builtProducts = await buildProducts(meshData.products, config);

  // Base result object
  const result = {
    meshData,
    builtProducts,
    productCount: builtProducts.length,
    totalCount: meshData.total_count,
  };

  // Step 3: Generate CSV if requested
  if (includeCSV) {
    const csvResult = await createCsv(builtProducts, config);
    result.csvData = csvResult;
    result.csvSize = csvResult.stats.originalSize;
  }

  return result;
}

module.exports = {
  exportMeshProducts,
};
