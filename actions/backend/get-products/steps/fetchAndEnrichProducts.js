const { getProducts } = require('../lib/api/products');
const { enrichProductsWithCategories } = require('../lib/api/categories');
const { getAuthToken } = require('../lib/auth');

/**
 * Fetches products from Adobe Commerce and enriches them with inventory and category data
 * @param {import('../index.js').ActionParams} params
 * @returns {Promise<Object[]>} Array of enriched product objects
 */
async function fetchAndEnrichProducts(params) {
  try {
    // Get authentication token
    const token = await getAuthToken(params);

    // Fetch products with optional inventory data
    const products = await getProducts(token, {
      COMMERCE_URL: params.COMMERCE_URL,
      include_inventory: params.include_inventory || false
    });

    // If category data is requested, enrich products with categories
    if (params.include_categories) {
      return await enrichProductsWithCategories(products, token, params);
    }

    return products;
  } catch (error) {
    throw new Error(`Failed to fetch and enrich products: ${error.message}`);
  }
}

module.exports = fetchAndEnrichProducts; 