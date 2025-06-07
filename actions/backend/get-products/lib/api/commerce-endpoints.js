/**
 * Commerce API endpoint configuration
 * @module lib/api/commerce-endpoints
 */

const { createLazyConfigGetter } = require('../../../../../src/core/config/lazy-loader');

/**
 * Lazy configuration getter for Commerce endpoint paths
 * @type {Function}
 */
const getEndpointConfig = createLazyConfigGetter('commerce-endpoints-config', (config) => ({
  paths: {
    products: config.url?.commerce?.paths?.products || '/rest/V1/products',
    stockItem: config.url?.commerce?.paths?.stockItem || '/rest/V1/stockItems',
    category: config.url?.commerce?.paths?.category || '/rest/V1/categories/:id',
    categoryList: config.url?.commerce?.paths?.categoryList || '/rest/V1/categories/list',
  },
}));

/**
 * Builds product endpoint URL with query parameters
 * @param {Object} params - Query parameters
 * @param {Object} [actionParams] - Action parameters for configuration
 * @returns {string} Product endpoint URL
 */
function products(params = {}, actionParams = {}) {
  const config = getEndpointConfig(actionParams);
  const queryParams = new URLSearchParams();

  // Add pagination criteria
  if (params.pageSize) {
    queryParams.append('searchCriteria[pageSize]', params.pageSize);
  }

  if (params.currentPage) {
    queryParams.append('searchCriteria[currentPage]', params.currentPage);
  }

  // Add fields to include media gallery entries for images and total_count for pagination
  queryParams.append(
    'fields',
    'items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries,custom_attributes],total_count'
  );

  const query = queryParams.toString();
  return `${config.paths.products}${query ? `?${query}` : ''}`;
}

/**
 * Builds stock item endpoint URL
 * @param {string} sku - Product SKU
 * @param {Object} [actionParams] - Action parameters for configuration
 * @returns {string} Stock item endpoint URL
 */
function stockItem(sku, actionParams = {}) {
  const config = getEndpointConfig(actionParams);
  const queryParams = new URLSearchParams();
  queryParams.append('searchCriteria[filter_groups][0][filters][0][field]', 'sku');
  queryParams.append('searchCriteria[filter_groups][0][filters][0][value]', sku);
  queryParams.append('searchCriteria[filter_groups][0][filters][0][condition_type]', 'eq');
  return `${config.paths.stockItem}?${queryParams.toString()}`;
}

/**
 * Builds category endpoint URL
 * @param {string} id - Category ID
 * @param {Object} [actionParams] - Action parameters for configuration
 * @returns {string} Category endpoint URL
 */
function category(id, actionParams = {}) {
  const config = getEndpointConfig(actionParams);
  return config.paths.category.replace(':id', id);
}

/**
 * Gets category list endpoint URL
 * @param {Object} [actionParams] - Action parameters for configuration
 * @returns {string} Category list endpoint URL
 */
function categoryList(actionParams = {}) {
  const config = getEndpointConfig(actionParams);
  return config.paths.categoryList;
}

module.exports = {
  products,
  stockItem,
  category,
  categoryList,
};
