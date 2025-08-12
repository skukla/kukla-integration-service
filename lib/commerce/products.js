/**
 * Adobe Commerce Products Module
 * Handles product fetching operations following Adobe standards
 */

const { fetchCommerceData, hasMorePages } = require('../utils');
const { handleTokenExpiration } = require('./auth');

/**
 * Fetch single page of products from Commerce API
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @param {number} pageSize - Products per page
 * @param {number} currentPage - Page number
 * @returns {Promise<Object>} API response with products
 */
async function fetchProductsPage(config, bearerToken, pageSize, currentPage) {
  const { baseUrl, api } = config.commerce;
  const productsUrl = `${baseUrl}/rest/${api.version}${api.paths.products}?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}`;

  const response = await fetchCommerceData(productsUrl, bearerToken, 'GET', 'Products');

  if (!response.items || !Array.isArray(response.items)) {
    throw new Error(`Products fetch failed on page ${currentPage}: Invalid response format`);
  }

  return response;
}

/**
 * Fetch products from Commerce API with pagination and caching
 * @param {string} username - Commerce admin username (for token expiration handling)
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @param {Object} cache - Cache instance (optional)
 * @param {Object} logger - Logger instance (optional)
 * @returns {Promise<Object>} Object with products array and apiCallCount
 */
async function fetchProducts(username, config, bearerToken, cache = null, logger = null) {
  const pageSize = config.commerce.pagination.pageSize;
  let currentPage = config.commerce.pagination.defaultPage;
  let allProducts = [];
  let apiCallCount = 0;
  let cacheHits = 0;

  let hasMore = true;

  while (hasMore) {
    const pageParams = { pageSize, currentPage };
    let response;

    // Try cache first
    if (cache) {
      const cached = await cache.get('products', pageParams, bearerToken);
      if (cached) {
        response = cached;
        cacheHits++;
        // Don't increment apiCallCount for cache hits
      }
    }

    // Fetch from API if not cached
    if (!response) {
      response = await fetchProductsPage(config, bearerToken, pageSize, currentPage);
      apiCallCount++; // Only count actual API calls

      // Handle token expiration
      if (response.isTokenExpired && cache) {
        await handleTokenExpiration(cache, username, logger);
      }

      // Cache successful responses
      if (cache && !response.isError) {
        await cache.put('products', pageParams, bearerToken, response);
      }
    }

    allProducts = allProducts.concat(response.items);

    // Check for more pages
    hasMore = hasMorePages(response, pageSize, currentPage);
    if (hasMore) {
      currentPage++;
    }
  }

  if (logger && cacheHits > 0) {
    logger.info(`Products cache performance: ${cacheHits} hits out of ${currentPage} pages`);
  }

  return {
    products: allProducts,
    apiCallCount,
    cacheHits,
    totalPages: currentPage, // Total number of pages processed
  };
}

module.exports = {
  fetchProducts,
};
