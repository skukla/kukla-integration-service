/**
 * Product Fetching Operations
 *
 * Mid-level business logic for fetching products from Commerce API.
 * Contains operations for paginated product retrieval with OAuth authentication.
 */

const { executeCommerceRequest, buildProductsEndpoint } = require('../../commerce');

/**
 * Validates Commerce configuration for product fetching
 * @param {Object} config - Configuration object
 * @throws {Error} If Commerce URL is not configured
 */
function validateProductFetchConfig(config) {
  if (!config.commerce.baseUrl) {
    throw new Error('Commerce URL not configured in environment');
  }
}

/**
 * Gets pagination configuration with defaults
 * @param {Object} config - Configuration object
 * @returns {Object} Pagination settings
 */
function getPaginationConfig(config) {
  return {
    pageSize: config.products.pagination.pageSize,
    maxPages: config.products.pagination.maxPages,
  };
}

/**
 * Builds the products API endpoint URL using configuration
 * @param {number} pageSize - Number of items per page
 * @param {number} currentPage - Current page number
 * @param {Object} config - Configuration object
 * @returns {string} Complete API endpoint URL
 */
function buildProductsApiUrl(pageSize, currentPage, config) {
  return buildProductsEndpoint(
    {
      pageSize,
      currentPage,
      fields: config.products.fields.export, // Use products config for Commerce API requests
    },
    config
  );
}

/**
 * Checks if pagination should continue
 * @param {Object} response - API response body
 * @param {number} currentPage - Current page number
 * @param {number} pageSize - Items per page
 * @param {number} maxPages - Maximum pages to fetch
 * @returns {boolean} True if should continue pagination
 */
function shouldContinuePagination(response, currentPage, pageSize, maxPages) {
  if (!response.body || !response.body.items || !Array.isArray(response.body.items)) {
    return false;
  }

  const totalCount = response.body.total_count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return currentPage < totalPages && currentPage < maxPages;
}

/**
 * Fetch products from Commerce API with OAuth authentication
 *
 * This function implements efficient pagination to handle large product catalogs.
 * It uses configurable page sizes and maximum page limits to balance performance
 * with memory usage. The function fetches comprehensive product data including
 * categories, media galleries, and custom attributes.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Array>} Array of product objects with full Commerce data
 * @throws {Error} If Commerce URL is not configured or API calls fail
 */
async function fetchProducts(params, config, trace = null) {
  validateProductFetchConfig(config);

  try {
    const allProducts = [];
    const { pageSize, maxPages } = getPaginationConfig(config);
    let currentPage = 1;

    do {
      const apiUrl = buildProductsApiUrl(pageSize, currentPage, config);
      const response = await executeCommerceRequest(
        apiUrl,
        { method: 'GET' },
        config,
        params,
        trace
      );

      if (response.body && response.body.items && response.body.items.length > 0) {
        allProducts.push(...response.body.items);
      }

      if (!shouldContinuePagination(response, currentPage, pageSize, maxPages)) {
        break;
      }

      currentPage++;
    } while (currentPage <= maxPages);

    return allProducts;
  } catch (error) {
    throw new Error(`Commerce API failed: ${error.message}`);
  }
}

module.exports = {
  validateProductFetchConfig,
  getPaginationConfig,
  buildProductsApiUrl,
  shouldContinuePagination,
  fetchProducts,
};
