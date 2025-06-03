/**
 * Commerce API endpoint configuration
 * @module lib/api/commerce-endpoints
 */

const { loadConfig } = require('../../../../../config');

// Load configuration with proper destructuring
const {
  url: {
    commerce: {
      paths: {
        products: PRODUCTS_PATH,
        stockItem: STOCK_ITEM_PATH,
        category: CATEGORY_PATH,
        categoryList: CATEGORY_LIST_PATH,
      },
    },
  },
} = loadConfig();

/**
 * Builds product endpoint URL with query parameters
 * @param {Object} params - Query parameters
 * @returns {string} Product endpoint URL
 */
function products(params = {}) {
  const queryParams = new URLSearchParams();

  // Add pagination criteria
  if (params.pageSize) {
    queryParams.append('searchCriteria[pageSize]', params.pageSize);
  }

  if (params.currentPage) {
    queryParams.append('searchCriteria[currentPage]', params.currentPage);
  }

  const query = queryParams.toString();
  return `${PRODUCTS_PATH}${query ? `?${query}` : ''}`;
}

/**
 * Builds stock item endpoint URL
 * @param {string} sku - Product SKU
 * @returns {string} Stock item endpoint URL
 */
function stockItem(sku) {
  const queryParams = new URLSearchParams();
  queryParams.append('searchCriteria[filter_groups][0][filters][0][field]', 'sku');
  queryParams.append('searchCriteria[filter_groups][0][filters][0][value]', sku);
  queryParams.append('searchCriteria[filter_groups][0][filters][0][condition_type]', 'eq');
  return `${STOCK_ITEM_PATH}?${queryParams.toString()}`;
}

/**
 * Builds category endpoint URL
 * @param {string} id - Category ID
 * @returns {string} Category endpoint URL
 */
function category(id) {
  return CATEGORY_PATH.replace(':id', id);
}

/**
 * Gets category list endpoint URL
 * @returns {string} Category list endpoint URL
 */
function categoryList() {
  return CATEGORY_LIST_PATH;
}

module.exports = {
  products,
  stockItem,
  category,
  categoryList,
};
