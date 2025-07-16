/**
 * REST API Export Workflow
 *
 * High-level orchestration for REST API-based product export process.
 * This workflow composes multiple business operations for REST API data sources.
 */

const { storeCsvFile } = require('../../files/workflows/file-management');
const { fetchAndEnrichProducts } = require('../operations/enrichment');
const { buildProducts } = require('../operations/transformation');
const { convertToCSV } = require('../utils/csv');

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
  const csvResult = await convertToCSV(builtProducts);

  return {
    productCount: builtProducts.length,
    csvSize: csvResult.length,
    csvContent: csvResult,
    products: builtProducts,
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
    const csvResult = await convertToCSV(builtProducts);

    return {
      csvSize: csvResult.length,
      csvContent: csvResult,
      products: builtProducts,
    };
  } catch (error) {
    throw new Error(`Product CSV transformation failed: ${error.message}`);
  }
}

/**
 * Complete product export workflow with storage and comprehensive error handling
 *
 * Full workflow that includes storage with fallback handling for when storage fails.
 * Provides comprehensive response data for action-level response building.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} core - Core utilities for step messaging
 * @param {Object} trace - Trace context
 * @returns {Promise<Object>} Complete export result with storage info and steps
 */
async function exportProductsWithStorageAndFallback(params, config, core, trace = null) {
  const steps = [];

  try {
    // Step 1: Export products to CSV
    const exportResult = await exportProducts(params, config, trace);

    steps.push(
      core.formatStepMessage('fetch-and-enrich', 'success', { count: exportResult.productCount })
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
  exportProducts,
  exportProductsWithStorage,
  buildProductCsv,
  exportProductsWithStorageAndFallback,
};
