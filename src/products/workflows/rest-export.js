/**
 * Products REST Export Workflows
 *
 * Product export workflows using Commerce REST API
 */

const { storeCsvFile } = require('../../files/operations/storage-operations');
const { fetchAndEnrichProducts } = require('../operations/enrichment');
const { buildProducts } = require('../operations/transformation');
const { convertToCSV } = require('../utils/csv');

// === EXPORT WORKFLOWS ===

/**
 * Complete product export workflow
 * Used by: exportProductsWithStorage, exportProductsWithStorageAndFallback functions
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} [trace=null] - Trace context
 * @returns {Promise<Object>} Export result with CSV info
 */
async function exportProducts(params, config, trace = null) {
  // Step 1: Fetch and enrich products from Commerce API
  const enrichedProducts = await fetchAndEnrichProducts(params, config, trace);

  // Step 2: Transform products for export format
  const builtProducts = await buildProducts(enrichedProducts, config);

  // Step 3: Convert to CSV format
  const csvResult = await convertToCSV(builtProducts, config);

  return {
    productCount: builtProducts.length,
    csvSize: csvResult.length,
    csvContent: csvResult,
    products: builtProducts,
  };
}

/**
 * Product export pipeline with storage
 * Used by: Available for actions needing simple storage without error handling
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} [trace=null] - Trace context
 * @returns {Promise<Object>} Export result with storage info
 */
async function exportProductsWithStorage(params, config, trace = null) {
  // Step 1: Execute complete product export workflow
  const exportResult = await exportProducts(params, config, trace);

  // Step 2: Store CSV file with configured storage provider
  const storageResult = await storeCsvFile(exportResult.csvContent, config, params);

  return {
    ...exportResult,
    storage: storageResult,
  };
}

/**
 * Complete product export workflow with storage and error handling
 * Used by: get-products action
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @param {Object} core - Core utilities for step messaging
 * @param {Object} [trace=null] - Trace context
 * @returns {Promise<Object>} Complete export result with storage info and steps
 */
async function exportProductsWithStorageAndFallback(params, config, core, trace = null) {
  const steps = [];

  try {
    // Step 1: Execute complete product export workflow
    const exportResult = await exportProducts(params, config, trace);

    steps.push(
      core.formatStepMessage('fetch-and-enrich', 'success', { count: exportResult.productCount })
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

// === UTILITY WORKFLOWS ===

/**
 * Product transformation pipeline
 * Used by: Available for direct product-to-CSV transformation workflows
 * @param {Object[]} products - Raw product data from Adobe Commerce
 * @returns {Promise<Object>} CSV generation result with transformed products
 */
async function buildProductCsv(products) {
  try {
    const builtProducts = await buildProducts(products);
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

module.exports = {
  // Main export workflows
  exportProducts,
  exportProductsWithStorage,
  exportProductsWithStorageAndFallback,

  // Utility workflows
  buildProductCsv,
};
