/**
 * Adobe Commerce Integration Module
 * Main entry point that orchestrates all commerce operations
 */

const { getCommerceToken } = require('./auth');
const { enrichProducts } = require('./enrichment');
const { getProductsFromMesh } = require('./mesh-client');
const { fetchProducts, transformMeshProductsToRestFormat } = require('./products');

/**
 * Fetch and enrich products from Adobe Commerce
 * Uses admin token authentication and enriches with categories/inventory
 *
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of enriched products
 */
async function fetchAndEnrichProducts(params, config) {
  try {
    let apiCallCount = 0;

    // Step 1: Get admin token using centralized approach
    const bearerToken = await getCommerceToken(params, config);
    apiCallCount += 1; // Token API call

    // Step 2: Fetch products from Commerce API
    const productsResult = await fetchProducts(params, config, bearerToken);
    apiCallCount += productsResult.apiCallCount; // Actual products API calls

    // Step 3: Enrich products with categories and inventory
    const enrichmentResult = await enrichProducts(productsResult.products, config, bearerToken);
    apiCallCount += enrichmentResult.apiCalls; // Category + inventory API calls

    return {
      products: enrichmentResult.products,
      apiCalls: {
        total: apiCallCount,
        adminToken: 1,
        products: productsResult.apiCallCount,
        categories: enrichmentResult.categoriesApiCalls,
        inventory: enrichmentResult.inventoryApiCalls,
      },
    };
  } catch (error) {
    throw new Error(`Commerce API integration failed: ${error.message}`);
  }
}

// Export all commerce functions
module.exports = {
  fetchAndEnrichProducts,
  getCommerceToken,
  fetchProducts,
  transformMeshProductsToRestFormat,
  enrichProducts,
  getProductsFromMesh,
};
