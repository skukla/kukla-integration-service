/**
 * Products Enrichment Operations
 *
 * Main orchestration for product data enrichment.
 * Coordinates the complete product enrichment pipeline by combining
 * product fetching, category enrichment, and inventory enrichment.
 *
 * Performance tracking handled by decorator pattern - no performance
 * logic mixed with business logic.
 */

const { enrichWithCategories } = require('./category-enrichment');
const { enrichWithInventory } = require('./inventory-enrichment');
const { fetchProducts } = require('./product-fetching');

/**
 * Fetch and enrich products with all data (categories and inventory)
 *
 * Pure business logic orchestration with no performance tracking mixed in.
 * Performance tracking is handled by decorator pattern when needed.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Array>} Array of fully enriched product objects
 * @throws {Error} If Commerce URL is missing, authentication fails, or critical API errors occur
 */
async function fetchAndEnrichProducts(params, config, trace = null) {
  try {
    // Step 1: Fetch base product data
    const products = await fetchProducts(params, config, trace);

    // Step 2: Enrich with categories first, then inventory
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

module.exports = {
  fetchAndEnrichProducts,
};
