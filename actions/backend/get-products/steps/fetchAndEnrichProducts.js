/**
 * Fetch and enrich products step for product export
 * @module steps/fetchAndEnrichProducts
 */
const { makeCommerceRequest } = require('../../../../src/commerce/api/integration');
const { getAuthToken } = require('../../../../src/commerce/api/integration');
const { enrichProductsWithCategories } = require('../lib/api/categories');
const { getInventory } = require('../lib/api/inventory');

/**
 * Fetch products from Commerce API with OAuth authentication
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL
 * @returns {Promise<Array>} Array of product objects
 */
async function fetchAndEnrichProducts(params, config) {
  // Direct object access with full autocompletion ✨
  const commerceUrl = config.commerce.baseUrl;

  if (!commerceUrl) {
    throw new Error('Commerce URL not configured in environment');
  }

  try {
    // Use OAuth-based Commerce request
    let allProducts = [];
    let currentPage = 1;
    const pageSize = config.products.batchSize || 50;
    const maxPages = 10; // Reasonable default

    do {
      const response = await makeCommerceRequest(
        `/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}&fields=items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries[file,url,position,types],custom_attributes],total_count`,
        {
          method: 'GET',
        },
        params
      );

      if (!response.body || !response.body.items || !Array.isArray(response.body.items)) {
        break;
      }

      allProducts = allProducts.concat(response.body.items);

      // Check if we have more pages
      const totalCount = response.body.total_count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      if (currentPage >= totalPages || currentPage >= maxPages) {
        break;
      }

      currentPage++;
    } while (currentPage <= maxPages);

    // Enrich products with category and inventory data
    console.log(`Enriching ${allProducts.length} products with category and inventory data...`);

    // Get auth token for enrichment calls
    const token = await getAuthToken(params);

    // Enrich with categories
    const enrichedProducts = await enrichProductsWithCategories(allProducts, token, params);

    // Get SKUs for inventory lookup
    const skus = allProducts.map((product) => product.sku);
    const inventoryMap = await getInventory(skus, params);

    // Add inventory data to products
    const finalProducts = enrichedProducts.map((product) => ({
      ...product,
      qty: inventoryMap[product.sku]?.qty || 0,
      is_in_stock: inventoryMap[product.sku]?.is_in_stock || false,
    }));

    return finalProducts;
  } catch (error) {
    throw new Error(`Commerce API failed: ${error.message}`);
  }
}

module.exports = fetchAndEnrichProducts;
