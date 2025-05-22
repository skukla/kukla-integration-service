/**
 * Product-related API calls to Adobe Commerce
 * @module lib/api/products
 */
const { buildHeaders } = require('../../../../core/http');
const { buildCommerceUrl, makeCommerceRequest } = require('../../../../commerce/integration');
const endpoints = require('./commerce-endpoints');

/**
 * Fetch all products from Adobe Commerce with pagination
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @param {string} params.COMMERCE_URL - Commerce instance URL
 * @returns {Promise<Object[]>} Array of product objects
 */
async function fetchAllProducts(token, params) {
  let currentPage = 1;
  const pageSize = 50;
  let allProducts = [];
  let totalCount = 0;
  
  do {
    const response = await makeCommerceRequest(
      buildCommerceUrl(params.COMMERCE_URL, endpoints.products({ currentPage, pageSize })),
      {
        method: 'GET',
        headers: buildHeaders(token)
      }
    );

    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch products: ${JSON.stringify(response.body)}`);
    }

    const data = response.body;
    allProducts = allProducts.concat(data.items);
    totalCount = data.total_count;
    currentPage++;

    console.log(`Fetched page ${currentPage - 1} of products (${allProducts.length}/${totalCount})`);
  } while (allProducts.length < totalCount);

  return allProducts;
}

/**
 * Fetch inventory data for a product
 * @param {string} sku - Product SKU
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @param {string} params.COMMERCE_URL - Commerce instance URL
 * @returns {Promise<Object>} Inventory data
 */
async function getInventory(sku, token, params) {
  const response = await makeCommerceRequest(
    buildCommerceUrl(params.COMMERCE_URL, endpoints.stockItem(sku)),
    {
      method: 'GET',
      headers: buildHeaders(token)
    }
  );

  if (response.statusCode === 200) {
    return {
      qty: response.body.qty,
      is_in_stock: response.body.is_in_stock
    };
  }
  
  console.warn(`Failed to fetch inventory for SKU ${sku}`);
  return { qty: 0, is_in_stock: false };
}

/**
 * Enrich products with inventory data
 * @param {Object[]} products - Array of product objects
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object[]>} Products enriched with inventory data
 */
async function enrichWithInventory(products, token, params) {
  const enrichedProducts = [];
  
  for (const product of products) {
    const inventory = await getInventory(product.sku, token, params);
    enrichedProducts.push({
      ...product,
      qty: inventory.qty
    });
  }

  return enrichedProducts;
}

module.exports = {
  fetchAllProducts,
  enrichWithInventory
}; 