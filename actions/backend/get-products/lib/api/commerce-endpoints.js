/**
 * Commerce API endpoint configuration
 * @module lib/api/commerce-endpoints
 */

/**
 * Builds product endpoint URL with query parameters
 * @param {Object} params - Query parameters
 * @param {Object} config - Configuration object
 * @returns {string} Product endpoint URL
 */
function products(params = {}, config) {
  const queryParams = new URLSearchParams();

  // Add pagination criteria
  if (params.pageSize) {
    queryParams.append('searchCriteria[pageSize]', params.pageSize);
  }

  if (params.currentPage) {
    queryParams.append('searchCriteria[currentPage]', params.currentPage);
  }

  // Add fields to include media gallery entries for images and total_count for pagination
  // Explicitly request url field in media_gallery_entries to get AEM asset URLs when available
  queryParams.append(
    'fields',
    'items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries[file,url,position,types],custom_attributes],total_count'
  );

  const query = queryParams.toString();
  return `${config.commerce.paths.products}${query ? `?${query}` : ''}`;
}

/**
 * Builds stock item endpoint URL
 * @param {string} sku - Product SKU
 * @param {Object} config - Configuration object
 * @returns {string} Stock item endpoint URL
 */
function stockItem(sku, config) {
  const queryParams = new URLSearchParams();
  queryParams.append('searchCriteria[filter_groups][0][filters][0][field]', 'sku');
  queryParams.append('searchCriteria[filter_groups][0][filters][0][value]', sku);
  queryParams.append('searchCriteria[filter_groups][0][filters][0][condition_type]', 'eq');
  return `${config.commerce.paths.stockItem}?${queryParams.toString()}`;
}

/**
 * Builds category endpoint URL
 * @param {string} id - Category ID
 * @param {Object} config - Configuration object
 * @returns {string} Category endpoint URL
 */
function category(id, config) {
  return config.commerce.paths.category.replace(':id', id);
}

/**
 * Gets category list endpoint URL
 * @param {Object} config - Configuration object
 * @returns {string} Category list endpoint URL
 */
function categoryList(config) {
  return config.commerce.paths.categoryList;
}

module.exports = {
  products,
  stockItem,
  category,
  categoryList,
};
