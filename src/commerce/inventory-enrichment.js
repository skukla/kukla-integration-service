/**
 * Commerce Inventory Enrichment - Feature Core
 * Complete inventory enrichment capability - Feature Core with Sub-modules
 */

// Import from feature sub-modules (same domain)
const { fetchInventoryDataWithBatching } = require('./inventory-enrichment/batch-processing');
const {
  applyInventoryToProducts,
  extractUniqueProductSkus,
} = require('./inventory-enrichment/data-application');
const { validateAndApplyStockRules } = require('./inventory-enrichment/stock-validation');

// Business Workflows

/**
 * Complete inventory enrichment workflow with intelligent batching and stock validation
 * @purpose Execute comprehensive inventory enrichment pipeline with batch processing, stock validation, and fallback strategies
 * @param {Array} products - Array of product objects to enrich with inventory data
 * @param {Object} config - Complete configuration object with Commerce API settings and batching preferences
 * @param {Object} params - Action parameters containing admin credentials for Commerce API

 * @param {Object} [options={}] - Enrichment options including stock validation and fallback strategies
 * @returns {Promise<Array>} Array of products enriched with complete inventory information
 * @throws {Error} When critical inventory fetching failures occur or validation errors prevent processing
 * @usedBy exportProducts in rest-export.js, fetchAndEnrichProducts in product-fetching.js, mesh export workflows
 */
async function enrichProductsWithInventoryAndValidation(products, config, params, options = {}) {
  if (!Array.isArray(products) || products.length === 0) {
    return products || [];
  }

  try {
    // Step 1: Extract and validate SKUs from all products
    const productSkus = extractUniqueProductSkus(products);
    if (productSkus.length === 0) {
      return products; // No SKUs to enrich
    }

    // Step 2: Fetch inventory data with intelligent batching
    const inventoryMap = await fetchInventoryDataWithBatching(productSkus, config, params, options);

    // Step 3: Validate and apply stock rules
    const enhancedInventoryMap = validateAndApplyStockRules(inventoryMap, options);

    // Step 4: Apply inventory data to products
    const enrichedProducts = await applyInventoryToProducts(products, enhancedInventoryMap);

    return enrichedProducts;
  } catch (error) {
    console.warn(`Inventory enrichment failed: ${error.message}`);
    if (options.throwOnError) {
      throw error;
    }
    return products; // Return products without enrichment as fallback
  }
}

/**
 * Simplified inventory enrichment without advanced validation
 * @purpose Basic inventory enrichment workflow for lightweight use cases
 * @param {Array} products - Array of product objects to enrich
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters with credentials
 * @param {Object} [trace=null] - Optional trace context
 * @returns {Promise<Array>} Products enriched with inventory data
 * @usedBy Basic inventory enrichment workflows
 */
async function enrichProductsWithInventory(products, config, params, trace = null) {
  return await enrichProductsWithInventoryAndValidation(products, config, params, trace, {
    applyBusinessRules: false,
    throwOnError: false,
  });
}

/**
 * Fetch inventory data for external use (API endpoint)
 * @purpose Provide inventory data to external systems and integrations
 * @param {Array} skus - Product SKUs to fetch inventory for
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters with credentials

 * @returns {Promise<Object>} Map of inventory data for external consumption
 * @usedBy External API endpoints, integrations
 */
async function fetchInventoryDataForExternalUse(skus, config, params) {
  return await fetchInventoryDataWithBatching(skus, config, params, {
    externalUse: true,
    includeMetadata: true,
  });
}

module.exports = {
  // Business workflows
  enrichProductsWithInventoryAndValidation,
  enrichProductsWithInventory,
  fetchInventoryDataForExternalUse,

  // Feature operations
  fetchInventoryDataWithBatching,
  applyInventoryToProducts,
  validateAndApplyStockRules,

  // Feature utilities
  extractUniqueProductSkus,
};
