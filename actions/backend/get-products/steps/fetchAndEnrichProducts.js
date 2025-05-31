/**
 * Fetch and enrich products with inventory and category information
 * @module steps/fetchAndEnrichProducts
 */

const { createTraceContext, traceStep } = require('../../../../src/core/tracing');
const { enrichProductsWithCategories } = require('../lib/api/categories');
const { getInventory } = require('../lib/api/inventory');
const { getProducts } = require('../lib/api/products');
const { getAuthToken } = require('../lib/auth');

/**
 * Fetch products and enrich them with inventory and category data
 * @param {Object} params - Action parameters
 * @returns {Promise<Array>} Enriched product data
 */
async function fetchAndEnrichProducts(params) {
  const trace = createTraceContext('fetch-and-enrich', params);

  try {
    // Get authentication token
    const token = await traceStep(trace, 'get-auth-token', () => getAuthToken(params));

    // Fetch base product data
    const products = await traceStep(trace, 'get-products', () => getProducts(token, params));

    // Enrich products with categories
    const productsWithCategories = await traceStep(trace, 'enrich-categories', () =>
      enrichProductsWithCategories(products, token, params)
    );

    // Get inventory data for all products
    const inventory = await traceStep(trace, 'get-inventory', () =>
      getInventory(
        products.map((product) => product.sku),
        token,
        params
      )
    );

    // Enrich products with inventory data
    return productsWithCategories.map((product) => ({
      ...product,
      inventory: inventory[product.sku] || { qty: 0, is_in_stock: false },
    }));
  } catch (error) {
    error.trace = trace;
    throw error;
  }
}

module.exports = {
  fetchAndEnrichProducts,
};
