/**
 * Product-related API calls to Adobe Commerce
 * @module lib/api/products
 */
const commerceEndpoints = require('./commerce-endpoints');
const { loadConfig } = require('../../../../../config');
const { getRequestedFields } = require('../../../../../src/commerce/data/product');
const { request, buildHeaders } = require('../../../../../src/core/http/client');
const { buildCommerceUrl } = require('../../../../../src/core/routing');
const { MemoryCache } = require('../../../../../src/core/storage/cache');

// Load configuration
const config = loadConfig();
const {
  api: {
    cache: { duration: CACHE_TTL },
  },
} = config.commerce;

/**
 * Make a cached request
 * @private
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
async function makeCachedRequest(url, options) {
  const cacheKey = `commerce:request:${url}:${JSON.stringify(options)}`;
  const cached = MemoryCache.get(cacheKey, { ttl: CACHE_TTL });
  if (cached) {
    return cached;
  }
  const response = await request(url, options);
  MemoryCache.set(cacheKey, response);
  return response;
}

/**
 * Filter product data to include only requested fields
 * @private
 * @param {Object} product - Raw product data
 * @param {Array<string>} fields - Fields to include
 * @returns {Object} Filtered product data
 */
function filterProductFields(product, fields) {
  const filtered = {};
  fields.forEach((field) => {
    if (product[field] !== undefined) {
      filtered[field] = product[field];
    }
  });
  return filtered;
}

/**
 * Fetch inventory data for a product
 * @param {string} sku - Product SKU
 * @param {string} token - Authentication token
 * @param {string} baseUrl - Commerce base URL
 * @returns {Promise<Object>} Inventory data
 */
async function getInventory(sku, token, baseUrl) {
  const endpoint = commerceEndpoints.stockItem(sku);
  const url = buildCommerceUrl(baseUrl, endpoint);
  const response = await makeCachedRequest(url, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (response.body && Array.isArray(response.body.items) && response.body.items.length > 0) {
    const totalQty = response.body.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const isInStock = response.body.items.some((item) => item.status === 1);
    return {
      qty: totalQty,
      is_in_stock: isInStock,
    };
  }
  return {
    qty: 0,
    is_in_stock: false,
  };
}

/**
 * Fetches all products with pagination and enriches them with inventory data
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Array of products
 */
async function fetchAllProducts(token, params = {}) {
  const { COMMERCE_URL } = params;
  if (!COMMERCE_URL) {
    throw new Error('COMMERCE_URL is required');
  }

  const endpoint = commerceEndpoints.products(params);
  console.log('Fetching products from endpoint:', endpoint);

  const url = buildCommerceUrl(COMMERCE_URL, endpoint);
  const response = await makeCachedRequest(url, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!response.body || !response.body.items || !Array.isArray(response.body.items)) {
    console.log('No items found in response:', response);
    return [];
  }

  // Get the fields to include
  const fields = getRequestedFields(params);

  // Enrich products with inventory data and filter fields
  const products = await Promise.all(
    response.body.items.map(async (product) => {
      const inventory = await getInventory(product.sku, token, COMMERCE_URL);
      const enrichedProduct = {
        ...product,
        ...inventory,
      };
      return filterProductFields(enrichedProduct, fields);
    })
  );

  return products;
}

/**
 * Get products from Adobe Commerce
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object[]>} Array of product objects
 */
async function getProducts(token, params) {
  return fetchAllProducts(token, params);
}

module.exports = {
  getProducts,
  fetchAllProducts,
};
