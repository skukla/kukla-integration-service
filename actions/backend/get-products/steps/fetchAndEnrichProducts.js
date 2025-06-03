/**
 * Fetch and enrich products step for product export
 * @module steps/fetchAndEnrichProducts
 */
const { enrichProductsWithCategories } = require('../lib/api/categories');
const { getProducts } = require('../lib/api/products');
const { getAuthToken } = require('../lib/auth');

/**
 * Fetch products from Commerce API and enrich with category data
 * @param {Object} params - Action parameters with Commerce URL and credentials
 * @returns {Promise<Array>} Array of enriched product objects
 */
async function fetchAndEnrichProducts(params) {
  const { COMMERCE_URL } = params;

  if (!COMMERCE_URL) {
    throw new Error('COMMERCE_URL is required for product export');
  }

  try {
    // Get authentication token
    const token = await getAuthToken(params);

    // Fetch products from Commerce API
    const rawProducts = await getProducts(token, params);

    // Enrich with category data
    const enrichedProducts = await enrichProductsWithCategories(rawProducts, token, params);

    return enrichedProducts;
  } catch (error) {
    throw new Error(`Commerce API failed: ${error.message}`);
  }
}

module.exports = fetchAndEnrichProducts;
