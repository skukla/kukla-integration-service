/**
 * Fetch and enrich products step for product export
 * @module steps/fetchAndEnrichProducts
 */
const { makeCommerceRequest } = require('../../../../src/commerce/api/integration');
const { getAuthToken } = require('../../../../src/commerce/api/integration');
const { enrichProductsWithCategories } = require('../lib/api/categories');
const { getInventory } = require('../lib/api/inventory');

/**
 * Fetches all products using paginated Commerce API requests
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} trace - Trace context
 * @returns {Promise<Array>} Array of all products
 */
async function fetchAllProducts(config, params, trace) {
  let allProducts = [];
  let currentPage = 1;
  const pageSize = config.products.batchSize || 50;
  const maxPages = 10;

  do {
    const response = await makeCommerceRequest(
      `/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}&fields=items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries[file,url,position,types],custom_attributes],total_count`,
      { method: 'GET' },
      config,
      params,
      trace
    );

    if (!response.body?.items || !Array.isArray(response.body.items)) {
      break;
    }

    allProducts = allProducts.concat(response.body.items);

    const totalCount = response.body.total_count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    if (currentPage >= totalPages || currentPage >= maxPages) {
      break;
    }

    currentPage++;
  } while (currentPage <= maxPages);

  return allProducts;
}

/**
 * Enriches products with category and inventory data
 * @param {Array} products - Products to enrich
 * @param {Object} context - API context
 * @param {Object} context.config - Configuration object
 * @param {Object} context.params - Action parameters
 * @param {Object} context.trace - Trace context
 * @returns {Promise<Array>} Enriched products
 */
async function enrichProductsData(products, context) {
  const { config, params, trace } = context;
  const token = await getAuthToken(config, params, trace);
  const enrichedProducts = await enrichProductsWithCategories(products, { token, params, trace });
  const skus = products.map((product) => product.sku);
  const inventoryMap = await getInventory(skus, params, trace);

  return enrichedProducts.map((product) => ({
    ...product,
    qty: inventoryMap[product.sku]?.qty || 0,
    is_in_stock: inventoryMap[product.sku]?.is_in_stock || false,
  }));
}

/**
 * Fetch products from Commerce API with OAuth authentication
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Array>} Array of product objects
 */
async function fetchAndEnrichProducts(params, config, trace = null) {
  if (!config.commerce.baseUrl) {
    throw new Error('Commerce URL not configured in environment');
  }

  try {
    const allProducts = await fetchAllProducts(config, params, trace);
    const context = { config, params, trace };
    return await enrichProductsData(allProducts, context);
  } catch (error) {
    throw new Error(`Commerce API failed: ${error.message}`);
  }
}

module.exports = fetchAndEnrichProducts;
