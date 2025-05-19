/**
 * Step to fetch and enrich products with inventory and category data
 * @module steps/fetchAndEnrichProducts
 */

const { getProducts } = require('../lib/api/products');
const { getCategories } = require('../lib/api/categories');

/**
 * Fetch products and enrich them with additional data
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Enriched products data
 */
async function fetchAndEnrichProducts(params) {
  // Get products from Commerce
  const products = await getProducts(params);

  // Get categories if needed
  if (params.include_categories) {
    const categories = await getCategories(params);
    // Enrich products with category data
    products.items = products.items.map(product => ({
      ...product,
      categories: product.category_ids.map(id => 
        categories.find(cat => cat.id === id)
      ).filter(Boolean)
    }));
  }

  return products;
}

module.exports = {
  fetchAndEnrichProducts
}; 