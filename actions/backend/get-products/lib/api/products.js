/**
 * Product-related API calls to Adobe Commerce
 * @module api/products
 */

const fetch = require('node-fetch');
const { getHeaders } = require('../../../../shared/http/headers');
const { getClient } = require('../../../../shared/http/client');
const { errorResponse } = require('../../../../shared/http/response');
const { endpoints, buildUrl } = require('../../../../shared/commerce/endpoints');
const { request } = require('../../../../shared/http/client');
const { headers } = require('../../../../shared/http/headers');
const { response } = require('../../../../shared/http/response');

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
      headers: getHeaders(token)
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
    headers: getHeaders(token)
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
  const url = buildUrl(params.baseUrl, endpoints.products.list);
  
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