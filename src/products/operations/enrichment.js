/**
 * Products Enrichment Operations
 *
 * Main orchestration for product data enrichment.
 * Coordinates the complete product enrichment pipeline by combining
 * product fetching, category enrichment, and inventory enrichment.
 */

const { enrichWithCategories } = require('./category-enrichment');
const { enrichWithInventory } = require('./inventory-enrichment');
const { fetchProducts } = require('./product-fetching');

/**
 * Fetch and enrich products with all data (categories and inventory)
 *
 * This is the main composition function that orchestrates the complete product
 * data enrichment pipeline. It combines multiple data sources to create a
 * comprehensive product dataset suitable for CSV export or frontend display.
 *
 * Data Pipeline:
 * 1. Fetch base product data from Commerce API (paginated)
 * 2. Extract category IDs from products and custom_attributes
 * 3. Batch fetch category details with concurrency control
 * 4. Enrich products with category names and hierarchy
 * 5. Extract SKUs for inventory lookup
 * 6. Batch fetch inventory data with concurrency control
 * 7. Enrich products with stock quantities and availability
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL and performance settings
 * @param {Object} [trace] - Optional trace context for API call tracking and performance monitoring
 * @returns {Promise<Array>} Array of fully enriched product objects with categories, inventory, and media
 * @throws {Error} If Commerce URL is missing, authentication fails, or critical API errors occur
 */
async function fetchAndEnrichProducts(params, config, trace = null) {
  try {
    const products = await fetchProducts(params, config, trace);

    // Enrich with categories first, then inventory
    const categorizedProducts = await enrichWithCategories(products, config, params, trace);
    const fullyEnrichedProducts = await enrichWithInventory(
      categorizedProducts,
      config,
      params,
      trace
    );

    return fullyEnrichedProducts;
  } catch (error) {
    throw new Error(`Product fetch and enrichment failed: ${error.message}`);
  }
}

// Re-export specialized functions for backward compatibility
module.exports = {
  // Import and re-export from specialized files
  ...require('./product-fetching'),
  ...require('./category-enrichment'),
  ...require('./inventory-enrichment'),

  // Main orchestration function
  fetchAndEnrichProducts,
};
