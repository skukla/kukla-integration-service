/**
 * Product Fetching - API Requests Sub-module
 * All Commerce API interaction and batch processing utilities
 */

const { executeAuthenticatedCommerceRequest } = require('../admin-token-auth');

// API Request Workflows

/**
 * Fetch products from Commerce API with comprehensive error handling
 * @purpose Execute Commerce API request for product data with query parameters and error recovery
 * @param {Object} query - Commerce API query parameters (searchCriteria, fields, etc.)
 * @param {Object} config - Configuration object with Commerce API settings
 * @param {Object} params - Action parameters containing admin credentials
 * @returns {Promise<Object>} Raw Commerce API response with product data and metadata
 * @throws {Error} When Commerce API request fails or returns invalid data
 * @usedBy fetchProductsWithPagination, fetchProducts, fetchProductsByCriteria
 */
async function fetchProductsFromCommerce(query, config, params) {
  try {
    const response = await executeAuthenticatedCommerceRequest(
      '/products',
      {
        method: 'GET',
        query: query,
      },
      config,
      params
    );

    if (!response.body || !response.body.items) {
      throw new Error('Invalid Commerce API response: missing product items');
    }

    return {
      products: response.body.items || [],
      totalCount: response.body.total_count || 0,
      searchCriteria: response.body.search_criteria || {},
      rawResponse: response.body,
    };
  } catch (error) {
    throw new Error(`Commerce API product fetch failed: ${error.message}`);
  }
}

/**
 * Fetch products in batches for large datasets
 * @purpose Handle large product datasets by fetching in configurable batches
 * @param {Object} query - Base query parameters for product fetching
 * @param {Object} config - Configuration object with batching settings
 * @param {Object} params - Action parameters containing admin credentials
 * @param {Object} [options={}] - Batching options including batch size and concurrency
 * @returns {Promise<Object>} Combined result from all batches with complete product data
 * @throws {Error} When batch processing fails or encounters critical errors
 * @usedBy Large dataset operations, bulk product processing
 */
async function fetchProductsInBatches(query, config, params, options = {}) {
  const batchSize = options.batchSize || config.commerce.product.pagination.batchSize || 100;
  const maxBatches = options.maxBatches || 10;
  const concurrency = options.concurrency || 3;

  let allProducts = [];
  let totalCount = 0;
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages && currentPage <= maxBatches) {
    const batches = [];

    // Create concurrent batch requests
    for (let i = 0; i < concurrency && hasMorePages; i++) {
      const batchQuery = {
        ...query,
        'searchCriteria[pageSize]': batchSize,
        'searchCriteria[currentPage]': currentPage,
      };

      batches.push(fetchProductsFromCommerce(batchQuery, config, params));
      currentPage++;
    }

    try {
      const batchResults = await Promise.all(batches);

      batchResults.forEach((result) => {
        allProducts = allProducts.concat(result.products);
        if (result.totalCount > totalCount) {
          totalCount = result.totalCount;
        }
      });

      // Check if we've fetched all available products
      hasMorePages =
        allProducts.length < totalCount && currentPage <= Math.ceil(totalCount / batchSize);
    } catch (error) {
      throw new Error(`Batch product fetching failed: ${error.message}`);
    }
  }

  return {
    products: allProducts,
    totalCount: totalCount,
    batchInfo: {
      batchSize,
      batchesProcessed: currentPage - 1,
      concurrency,
      productsPerBatch: batchSize,
    },
  };
}

module.exports = {
  // Workflows (used by feature core)
  fetchProductsFromCommerce,
  fetchProductsInBatches,
};
