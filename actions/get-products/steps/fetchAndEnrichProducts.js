/**
 * Step to fetch and enrich products with inventory and category data
 * @module steps/fetchAndEnrichProducts
 */

const { resolveToken } = require('../lib/auth');
const { fetchAllProducts, fetchProductQty } = require('../lib/api/products');
const { buildCategoryMap } = require('../lib/api/categories');

/**
 * Fetches products from Adobe Commerce and enriches them with inventory and category data.
 * 
 * @param {Object} params - Configuration parameters for Adobe Commerce
 * @param {string} params.COMMERCE_URL - The base URL of the Adobe Commerce instance
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username for authentication
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password for authentication
 * @returns {Promise<Object>} Object containing enriched product data
 * @property {string} token - The authentication token for Adobe Commerce
 * @property {Object[]} products - Raw product data from Adobe Commerce
 * @property {Object[]} productsWithInventory - Products enriched with inventory information
 * @property {Object} categoryMap - Mapping of category IDs to category details
 */
module.exports = async function fetchAndEnrichProducts(params) {
  // Get authentication token
  const token = await resolveToken(params);
  
  // Fetch base product data
  const products = await fetchAllProducts(token, params);
  
  // Enrich products with inventory data
  const productsWithInventory = await Promise.all(
    products.map(async (product) => {
      const qty = await fetchProductQty(product.sku, token, params);
      return { ...product, qty };
    })
  );
  
  // Build category mapping
  const categoryMap = await buildCategoryMap(productsWithInventory, token, params);
  
  return { 
    token, 
    products, 
    productsWithInventory, 
    categoryMap 
  };
}; 