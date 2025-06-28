/**
 * Fetch and enrich products step for product export
 * @module steps/fetchAndEnrichProducts
 */
const { makeCommerceRequest } = require('../../../../src/commerce/api/integration');

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
        `/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}`,
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

    return allProducts;
  } catch (error) {
    throw new Error(`Commerce API failed: ${error.message}`);
  }
}

module.exports = fetchAndEnrichProducts;
