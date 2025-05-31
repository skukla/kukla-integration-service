/**
 * Adobe Commerce REST API endpoint definitions
 * @module lib/api/commerce-endpoints
 */

/**
 * Get products endpoint with pagination
 * @param {Object} options - Endpoint options
 * @param {number} [options.pageSize=20] - Number of products per page
 * @param {number} [options.currentPage=1] - Current page number
 * @returns {string} Products endpoint path
 */
function products(options = {}) {
  return `/rest/V1/products?searchCriteria[pageSize]=${options.pageSize || 20}&searchCriteria[currentPage]=${options.currentPage || 1}`;
}

/**
 * Get stock item endpoint for a specific SKU
 * @param {string} sku - Product SKU
 * @returns {string} Stock item endpoint path
 */
function stockItem(sku) {
  return `/rest/V1/inventory/source-items?searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]=${sku}`;
}

/**
 * Get category endpoint for a specific category ID
 * @param {string} id - Category ID
 * @returns {string} Category endpoint path
 */
function category(id) {
  return `/rest/V1/categories/${id}`;
}

/**
 * Get admin token endpoint
 * @returns {string} Admin token endpoint path
 */
function adminToken() {
  return '/rest/V1/integration/admin/token';
}

module.exports = {
  products,
  stockItem,
  category,
  adminToken,
};
