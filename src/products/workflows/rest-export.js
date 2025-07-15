/**
 * REST API Export Workflow
 *
 * High-level orchestration for REST API-based product export process.
 * This workflow composes multiple business operations for REST API data sources.
 */

const { storeCsvFile } = require('../../files/workflows/file-management');
const { fetchAndEnrichProducts } = require('../operations/enrichment');
const { buildProducts } = require('../operations/transformation');
const { createCsv } = require('../utils/csv');

/**
 * Complete product export workflow
 *
 * Orchestrates the full process from fetching to CSV generation.
 * This is the main entry point for product export operations.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} trace - Trace context
 * @returns {Promise<Object>} Export result with CSV info
 */
async function exportProducts(params, config, trace = null) {
  // Step 1: Fetch and enrich products
  const enrichedProducts = await fetchAndEnrichProducts(params, config, trace);

  // Step 2: Transform to standard format
  const builtProducts = await buildProducts(enrichedProducts, config);

  // Step 3: Generate CSV
  const csvResult = await createCsv(builtProducts);

  return {
    productCount: builtProducts.length,
    csvSize: csvResult.content.length,
    csvContent: csvResult.content,
    stats: csvResult.stats,
    transformedProducts: builtProducts,
  };
}

/**
 * Complete product export pipeline with storage
 *
 * Full workflow that includes file storage.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} trace - Trace context
 * @returns {Promise<Object>} Export result with storage info
 */
async function exportProductsWithStorage(params, config, trace = null) {
  // Step 1-3: Export products to CSV
  const exportResult = await exportProducts(params, config, trace);

  // Step 4: Store file
  const storageResult = await storeCsvFile(exportResult.csvContent, config, params);

  return {
    ...exportResult,
    storage: storageResult,
  };
}

/**
 * Complete product transformation pipeline
 * Composition function that combines product building and CSV generation.
 *
 * @param {Object[]} products - Raw product data from Adobe Commerce
 * @returns {Promise<Object>} CSV generation result with transformed products
 * @throws {Error} If transformation or CSV generation fails
 */
async function buildProductCsv(products) {
  try {
    // Transform products first
    const builtProducts = await buildProducts(products);

    // Generate CSV from transformed products
    const csvResult = await createCsv(builtProducts);

    return {
      ...csvResult,
      transformedProducts: builtProducts,
    };
  } catch (error) {
    throw new Error(`Product CSV transformation failed: ${error.message}`);
  }
}

module.exports = {
  exportProducts,
  exportProductsWithStorage,
  buildProductCsv,
};
