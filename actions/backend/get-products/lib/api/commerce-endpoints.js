/**
 * Adobe Commerce REST API endpoint definitions
 * @module lib/api/commerce-endpoints
 */

/**
 * Builds the products endpoint path with pagination
 * @param {Object} options - Endpoint options
 * @param {number} [options.currentPage=1] - Current page number
 * @param {number} [options.pageSize=50] - Items per page
 * @returns {string} Products endpoint path
 */
function products(options = {}) {
  const {
    currentPage = 1,
    pageSize = 50
  } = options;

  return `/V1/products?searchCriteria[currentPage]=${currentPage}&searchCriteria[pageSize]=${pageSize}`;
}

/**
 * Builds the stock item endpoint path for a specific SKU
 * @param {string} sku - Product SKU
 * @returns {string} Stock item endpoint path
 */
function stockItem(sku) {
  return `/V1/stockItems/${encodeURIComponent(sku)}`;
}

/**
 * Builds the category endpoint path for a specific category ID
 * @param {string|number} categoryId - Category ID
 * @returns {string} Category endpoint path
 */
function category(categoryId) {
  return `/V1/categories/${categoryId}`;
}

/**
 * Builds the admin token endpoint path
 * @returns {string} Admin token endpoint path
 */
function adminToken() {
  return '/V1/integration/admin/token';
}

module.exports = {
  products,
  stockItem,
  category,
  adminToken
}; 