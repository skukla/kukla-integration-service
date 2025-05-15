/**
 * Adobe Commerce REST API endpoint definitions
 * @module commerce-endpoints
 */

/**
 * Builds the products endpoint URL
 * @param {string} baseUrl - Adobe Commerce instance base URL
 * @returns {string} Complete products endpoint URL
 */
function products(baseUrl) {
  return `${baseUrl}/rest/V1/products`;
}

/**
 * Builds the stock item endpoint URL for a specific SKU
 * @param {string} baseUrl - Adobe Commerce instance base URL
 * @param {string} sku - Product SKU
 * @returns {string} Complete stock item endpoint URL
 */
function stockItem(baseUrl, sku) {
  return `${baseUrl}/rest/V1/stockItems/${encodeURIComponent(sku)}`;
}

/**
 * Builds the category endpoint URL for a specific category ID
 * @param {string} baseUrl - Adobe Commerce instance base URL
 * @param {string|number} categoryId - Category ID
 * @returns {string} Complete category endpoint URL
 */
function category(baseUrl, categoryId) {
  return `${baseUrl}/rest/V1/categories/${categoryId}`;
}

module.exports = {
  products,
  stockItem,
  category
}; 