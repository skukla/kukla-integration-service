/**
 * Commerce Shared - Endpoint Builders
 * Cross-feature endpoint building utilities for Commerce API
 */

/**
 * Format product fields array for Commerce API URL
 * @param {Array<string>} fields - Product fields array
 * @returns {string} Formatted fields string for URL
 */
function formatProductFieldsForUrl(fields) {
  // Convert array to Commerce API URL format
  const itemFields = fields.join(',');
  return `items[${itemFields}],total_count`;
}

/**
 * Builds product endpoint URL with query parameters
 * @param {Object} params - Query parameters
 * @param {number} [params.pageSize] - Number of items per page
 * @param {number} [params.currentPage] - Current page number
 * @param {string} [params.searchTerm] - Search term for product name/SKU
 * @param {Array<string>} [params.fields] - Specific fields to include
 * @returns {string} Product endpoint URL with query parameters
 */
function buildProductsEndpoint(params = {}) {
  const queryParams = new URLSearchParams();

  // Add pagination criteria
  if (params.pageSize) {
    queryParams.append('searchCriteria[pageSize]', params.pageSize);
  }

  if (params.currentPage) {
    queryParams.append('searchCriteria[currentPage]', params.currentPage);
  }

  // Add search criteria if provided
  if (params.searchTerm) {
    // Search in both name and SKU fields
    queryParams.append('searchCriteria[filter_groups][0][filters][0][field]', 'name');
    queryParams.append(
      'searchCriteria[filter_groups][0][filters][0][value]',
      `%${params.searchTerm}%`
    );
    queryParams.append('searchCriteria[filter_groups][0][filters][0][condition_type]', 'like');

    queryParams.append('searchCriteria[filter_groups][0][filters][1][field]', 'sku');
    queryParams.append(
      'searchCriteria[filter_groups][0][filters][1][value]',
      `%${params.searchTerm}%`
    );
    queryParams.append('searchCriteria[filter_groups][0][filters][1][condition_type]', 'like');
  }

  // Add field selection if provided
  if (params.fields && Array.isArray(params.fields) && params.fields.length > 0) {
    const fieldsParam = formatProductFieldsForUrl(params.fields);
    queryParams.append('fields', fieldsParam);
  }

  // Build endpoint with query parameters
  const endpoint = '/rest/V1/products';
  const queryString = queryParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

/**
 * Builds stock item endpoint for inventory data
 * @param {string} sku - Product SKU
 * @returns {string} Stock item endpoint URL
 */
function buildStockItemEndpoint(sku) {
  return `/rest/V1/stockItems/${encodeURIComponent(sku)}`;
}

/**
 * Builds category endpoint URL
 * @param {number} categoryId - Category ID
 * @returns {string} Category endpoint URL
 */
function buildCategoryEndpoint(categoryId) {
  return `/rest/V1/categories/${categoryId}`;
}

/**
 * Builds category list endpoint URL with query parameters
 * @param {Object} params - Query parameters
 * @returns {string} Category list endpoint URL
 */
function buildCategoryListEndpoint(params = {}) {
  const queryParams = new URLSearchParams();

  if (params.rootCategoryId) {
    queryParams.append('rootCategoryId', params.rootCategoryId);
  }

  if (params.depth) {
    queryParams.append('depth', params.depth);
  }

  const endpoint = '/rest/V1/categories/list';
  const queryString = queryParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

/**
 * Builds admin token endpoint URL
 * @returns {string} Admin token endpoint URL
 */
function buildAdminTokenEndpoint() {
  return '/rest/V1/integration/admin/token';
}

module.exports = {
  // Product endpoints
  buildProductsEndpoint,
  formatProductFieldsForUrl,

  // Inventory endpoints
  buildStockItemEndpoint,

  // Category endpoints
  buildCategoryEndpoint,
  buildCategoryListEndpoint,

  // Authentication endpoints
  buildAdminTokenEndpoint,
};
