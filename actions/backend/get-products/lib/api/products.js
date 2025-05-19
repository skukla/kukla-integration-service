/**
 * Product-related API calls to Adobe Commerce
 * @module api/products
 */

const fetch = require('node-fetch');
const { request, headers, response, buildFullUrl, buildCommerceUrl } = require('../../../../core/http');

/**
 * Fetch all products from the Adobe Commerce REST API with pagination.
 * @async
 * @param {string} token - Bearer token for authentication
 * @param {Object} params - Action input parameters
 * @param {string} params.COMMERCE_URL - Adobe Commerce instance URL
 * @returns {Promise<Array<Object>>} Array of product objects from Adobe Commerce
 * @throws {Error} If the API request fails or returns an error
 */
async function fetchAllProducts(token, params) {
  let currentPage = 1;
  const pageSize = 200;
  let allProducts = [];
  let totalCount = 0;
  const restEndpoint = buildCommerceUrl(params.COMMERCE_URL, '/V1/products');

  do {
    const url = `${restEndpoint}?searchCriteria[currentPage]=${currentPage}&searchCriteria[pageSize]=${pageSize}`;
    const res = await fetch(url, {
      headers: headers.commerce(token)
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    allProducts = allProducts.concat(data.items);
    totalCount = data.total_count;
    currentPage++;
  } while (allProducts.length < totalCount);

  return allProducts;
}

/**
 * Fetch inventory (qty) for a given SKU from the REST API.
 * @async
 * @param {string} sku - The product SKU
 * @param {string} token - Bearer token for authentication
 * @param {Object} params - Action input parameters
 * @param {string} params.COMMERCE_URL - Adobe Commerce instance URL
 * @returns {Promise<number|undefined>} The quantity or undefined if not found
 */
async function fetchProductQty(sku, token, params) {
  const url = buildCommerceUrl(params.COMMERCE_URL, `/V1/stockItems/${sku}`);
  const res = await fetch(url, {
    headers: headers.commerce(token)
  });
  if (!res.ok) {
    return undefined;
  }
  const data = await res.json();
  return data.qty;
}

/**
 * Get products from Adobe Commerce
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Products data
 */
async function getProducts(params) {
  const url = buildCommerceUrl(params.baseUrl, '/V1/products');
  
  try {
    const response = await request(url, {
      method: 'GET',
      headers: headers.commerce(params.token)
    });

    return response.json();
  } catch (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }
}

module.exports = {
  fetchAllProducts,
  fetchProductQty,
  getProducts
}; 