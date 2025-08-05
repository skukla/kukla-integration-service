/**
 * Adobe Commerce Integration Module
 * Main entry point that orchestrates all commerce operations
 */

const { getAdminToken, getCommerceToken } = require('./auth');
const { enrichProducts } = require('./enrichment');
const { getProductsFromMesh } = require('./mesh');
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
    const products = await fetchProducts(params, config, bearerToken);
    apiCallCount += 1; // Products API call

    // Step 3: Enrich products with categories and inventory
    const enrichmentResult = await enrichProducts(products, config, bearerToken);
    apiCallCount += enrichmentResult.apiCalls; // Category + inventory API calls

    return {
      products: enrichmentResult.products,
      apiCalls: {
        total: apiCallCount,
        adminToken: 1,
        products: 1,
        categories: enrichmentResult.categoriesApiCalls,
        inventory: enrichmentResult.inventoryApiCalls,
      },
    };
  } catch (error) {
    throw new Error(`Commerce API integration failed: ${error.message}`);
  }
}

// Re-export all modules for backward compatibility
module.exports = {
  fetchAndEnrichProducts,
  getAdminToken,
  getCommerceToken,
  fetchProducts,
  transformMeshProductsToRestFormat,
  enrichProducts,
  getProductsFromMesh,
};
