/**
 * Product Fetching Operations
 *
 * Mid-level business logic for fetching products from Commerce API.
 * Contains operations for paginated product retrieval with OAuth authentication.
 */

const { executeCommerceRequest } = require('../../commerce');

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
    pageSize: config.mesh.pagination.defaultPageSize || config.products.batchSize || 50,
    maxPages: config.mesh.pagination.maxPages || 25,
  };
}

/**
 * Builds the products API endpoint URL with required fields
 * @param {number} pageSize - Number of items per page
 * @param {number} currentPage - Current page number
 * @returns {string} Complete API endpoint URL
 */
function buildProductsApiUrl(pageSize, currentPage) {
  const fields =
    'items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries[file,url,position,types],custom_attributes],total_count';
  return `/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}&fields=${fields}`;
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
      const apiUrl = buildProductsApiUrl(pageSize, currentPage);
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
