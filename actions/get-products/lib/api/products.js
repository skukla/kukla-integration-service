/**
 * Product-related API calls to Adobe Commerce
 * @module api/products
 */

const fetch = require('node-fetch');
const { buildHeaders } = require('../../../utils');
const endpoints = require('../commerce-endpoints');

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
  const restEndpoint = endpoints.products(params.COMMERCE_URL);

  do {
    const url = `${restEndpoint}?searchCriteria[currentPage]=${currentPage}&searchCriteria[pageSize]=${pageSize}`;
    const res = await fetch(url, {
      headers: buildHeaders(token)
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
  const url = endpoints.stockItem(params.COMMERCE_URL, sku);
  const res = await fetch(url, {
    headers: buildHeaders(token)
  });
  if (!res.ok) {
    return undefined;
  }
  const data = await res.json();
  return data.qty;
}

module.exports = {
  fetchAllProducts,
  fetchProductQty
}; 