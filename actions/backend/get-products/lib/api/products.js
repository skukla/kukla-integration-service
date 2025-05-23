/**
 * Product-related API calls to Adobe Commerce
 * @module lib/api/products
 */
const { buildHeaders } = require('../../../../core/http');
const { buildCommerceUrl, makeCommerceRequest } = require('../../../../commerce/integration');
const { processConcurrently } = require('./concurrency');
const endpoints = require('./commerce-endpoints');

// Optimal values based on Adobe Commerce API performance characteristics
const OPTIMAL_PAGE_SIZE = 100;
const MAX_CONCURRENT_REQUESTS = 3;
const REQUEST_RETRIES = 2;
const RETRY_DELAY = 1000;

/**
 * Fetch a single page of products from Adobe Commerce
 * @private
 * @param {Object} params - Request parameters
 * @param {string} params.token - Authentication token
 * @param {string} params.COMMERCE_URL - Commerce instance URL
 * @param {number} params.page - Page number to fetch
 * @param {number} params.pageSize - Number of items per page
 * @returns {Promise<Object>} Page data with items and total count
 */
async function fetchProductPage({ token, COMMERCE_URL, page, pageSize }) {
  const response = await makeCommerceRequest(
    buildCommerceUrl(COMMERCE_URL, endpoints.products({ currentPage: page, pageSize })),
    {
      method: 'GET',
      headers: buildHeaders(token)
    }
  );

  if (response.statusCode !== 200) {
    throw new Error(`Failed to fetch products page ${page}: ${JSON.stringify(response.body)}`);
  }

  return response.body;
}

/**
 * Fetch all products from Adobe Commerce with parallel pagination
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @param {string} params.COMMERCE_URL - Commerce instance URL
 * @returns {Promise<Object[]>} Array of product objects
 */
async function fetchAllProducts(token, params) {
  // Get first page to determine total count
  const firstPage = await fetchProductPage({ 
    token, 
    COMMERCE_URL: params.COMMERCE_URL, 
    page: 1, 
    pageSize: OPTIMAL_PAGE_SIZE 
  });
  
  const totalCount = firstPage.total_count;
  const totalPages = Math.ceil(totalCount / OPTIMAL_PAGE_SIZE);
  
  console.log(`Found ${totalCount} products, fetching ${totalPages} pages with size ${OPTIMAL_PAGE_SIZE}`);
  
  // If only one page, return it
  if (totalPages <= 1) {
    return firstPage.items;
  }
  
  // Generate page numbers for remaining pages
  const remainingPages = Array.from(
    { length: totalPages - 1 }, 
    (_, i) => i + 2
  );
  
  // Fetch remaining pages in parallel with controlled concurrency
  const pageResults = await processConcurrently(
    remainingPages,
    async (page) => fetchProductPage({ 
      token, 
      COMMERCE_URL: params.COMMERCE_URL, 
      page, 
      pageSize: OPTIMAL_PAGE_SIZE 
    }),
    {
      concurrency: MAX_CONCURRENT_REQUESTS,
      retries: REQUEST_RETRIES,
      retryDelay: RETRY_DELAY
    }
  );
  
  // Combine all products
  const allProducts = [
    ...firstPage.items,
    ...pageResults.flatMap(result => result.items)
  ];
  
  console.log(`Successfully fetched ${allProducts.length} products`);
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

  if (response.statusCode === 200 && response.body.items && response.body.items.length > 0) {
    // Sum up quantities from all sources
    const totalQty = response.body.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    // Product is in stock if any source has it in stock
    const isInStock = response.body.items.some(item => item.status === 1);

    return {
      qty: totalQty,
      is_in_stock: isInStock
    };
  }
  
  console.warn(`Failed to fetch inventory for SKU ${sku} - Status: ${response.statusCode}`);
  return {
    qty: 0,
    is_in_stock: false
  };
}

/**
 * Enrich products with inventory data in parallel
 * @param {Object[]} products - Array of product objects
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object[]>} Products enriched with inventory data
 */
async function enrichWithInventory(products, token, params) {
  // Filter products that need inventory data
  const productsNeedingInventory = products.filter(
    product => product.type_id === 'simple' || product.type_id === 'virtual'
  );
  
  console.log(`Fetching inventory for ${productsNeedingInventory.length} products`);
  
  // Fetch inventory data in parallel
  const inventoryData = await processConcurrently(
    productsNeedingInventory,
    async (product) => ({
      sku: product.sku,
      inventory: await getInventory(product.sku, token, params)
    }),
    {
      concurrency: MAX_CONCURRENT_REQUESTS,
      retries: REQUEST_RETRIES,
      retryDelay: RETRY_DELAY
    }
  );
  
  // Create inventory lookup map
  const inventoryMap = inventoryData.reduce((map, { sku, inventory }) => {
    map[sku] = inventory;
    return map;
  }, {});
  
  // Enrich all products with inventory data
  return products.map(product => ({
    ...product,
    qty: inventoryMap[product.sku]?.qty || 0
  }));
}

module.exports = {
  fetchAllProducts,
  enrichWithInventory
}; 