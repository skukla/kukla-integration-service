/**
 * Commerce API Endpoints Module
 * @module commerce/endpoints
 *
 * Provides Commerce API endpoint building and URL construction functionality.
 * Uses functional composition with pure functions and clear input/output contracts.
 */

/**
 * Builds product endpoint URL with query parameters
 * @param {Object} params - Query parameters
 * @param {number} [params.pageSize] - Number of items per page
 * @param {number} [params.currentPage] - Current page number
 * @param {string} [params.searchTerm] - Search term for product name/SKU
 * @param {Array<string>} [params.fields] - Specific fields to include
 * @param {Object} config - Configuration object
 * @returns {string} Product endpoint URL with query parameters
 */
function buildProductsEndpoint(params = {}, config) {
  const queryParams = new URLSearchParams();

  // Add pagination criteria
  if (params.pageSize) {
    queryParams.append('searchCriteria[pageSize]', params.pageSize);
  }

  if (params.currentPage) {
    queryParams.append('searchCriteria[currentPage]', params.currentPage);
  }

  // Add search criteria
  if (params.searchTerm) {
    queryParams.append('searchCriteria[filter_groups][0][filters][0][field]', 'name');
    queryParams.append(
      'searchCriteria[filter_groups][0][filters][0][value]',
      `%${params.searchTerm}%`
    );
    queryParams.append('searchCriteria[filter_groups][0][filters][0][condition_type]', 'like');
  }

  // Add fields to include media gallery entries for images and total_count for pagination
  // Explicitly request url field in media_gallery_entries to get AEM asset URLs when available
  const defaultFields =
    'items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries[file,url,position,types],custom_attributes],total_count';
  const fields = params.fields ? `items[${params.fields.join(',')}],total_count` : defaultFields;
  queryParams.append('fields', fields);

  const query = queryParams.toString();
  return `${config.commerce.paths.products}${query ? `?${query}` : ''}`;
}

/**
 * Builds stock item endpoint URL for inventory data
 * @param {string|Array<string>} sku - Product SKU or array of SKUs
 * @param {Object} config - Configuration object
 * @returns {string} Stock item endpoint URL
 */
function buildStockItemEndpoint(sku, config) {
  const queryParams = new URLSearchParams();

  if (Array.isArray(sku)) {
    // Handle multiple SKUs
    queryParams.append('searchCriteria[filter_groups][0][filters][0][field]', 'sku');
    queryParams.append('searchCriteria[filter_groups][0][filters][0][value]', sku.join(','));
    queryParams.append('searchCriteria[filter_groups][0][filters][0][condition_type]', 'in');
  } else {
    // Handle single SKU
    queryParams.append('searchCriteria[filter_groups][0][filters][0][field]', 'sku');
    queryParams.append('searchCriteria[filter_groups][0][filters][0][value]', sku);
    queryParams.append('searchCriteria[filter_groups][0][filters][0][condition_type]', 'eq');
  }

  return `${config.commerce.paths.stockItem}?${queryParams.toString()}`;
}

/**
 * Builds category endpoint URL for a specific category
 * @param {string} id - Category ID
 * @param {Object} config - Configuration object
 * @returns {string} Category endpoint URL
 */
function buildCategoryEndpoint(id, config) {
  return config.commerce.paths.category.replace(':id', id);
}

/**
 * Builds category list endpoint URL
 * @param {Object} [params] - Query parameters
 * @param {number} [params.pageSize] - Number of categories per page
 * @param {number} [params.currentPage] - Current page number
 * @param {Object} config - Configuration object
 * @returns {string} Category list endpoint URL
 */
function buildCategoryListEndpoint(params = {}, config) {
  const queryParams = new URLSearchParams();

  // Add pagination if provided
  if (params.pageSize) {
    queryParams.append('searchCriteria[pageSize]', params.pageSize);
  }

  if (params.currentPage) {
    queryParams.append('searchCriteria[currentPage]', params.currentPage);
  }

  const query = queryParams.toString();
  return `${config.commerce.paths.categoryList}${query ? `?${query}` : ''}`;
}

/**
 * Builds admin token endpoint URL
 * @param {Object} config - Configuration object
 * @returns {string} Admin token endpoint URL
 */
function buildAdminTokenEndpoint(config) {
  return config.commerce.paths.adminToken || '/integration/admin/token';
}

/**
 * Builds customer endpoint URL
 * @param {string} [customerId] - Customer ID (optional)
 * @param {Object} config - Configuration object
 * @returns {string} Customer endpoint URL
 */
function buildCustomerEndpoint(customerId = null, config) {
  const basePath = config.commerce.paths.customer || '/customers';
  return customerId ? `${basePath}/${customerId}` : basePath;
}

/**
 * Builds order endpoint URL
 * @param {string} [orderId] - Order ID (optional)
 * @param {Object} [params] - Query parameters
 * @param {Object} config - Configuration object
 * @returns {string} Order endpoint URL
 */
function buildOrderEndpoint(orderId = null, params = {}, config) {
  const basePath = config.commerce.paths.order || '/orders';
  let endpoint = orderId ? `${basePath}/${orderId}` : basePath;

  // Add query parameters if provided
  if (Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    endpoint += `?${queryParams.toString()}`;
  }

  return endpoint;
}

/**
 * Builds search endpoint URL for complex queries
 * @param {Object} searchCriteria - Search criteria object
 * @param {Object} config - Configuration object
 * @returns {string} Search endpoint URL
 */
function buildSearchEndpoint(searchCriteria, config) {
  const queryParams = new URLSearchParams();

  // Convert search criteria to URL parameters
  if (searchCriteria) {
    const encodedCriteria = encodeURIComponent(JSON.stringify(searchCriteria));
    queryParams.append('searchCriteria', encodedCriteria);
  }

  const basePath = config.commerce.paths.search || '/search';
  return `${basePath}?${queryParams.toString()}`;
}

/**
 * Builds a generic endpoint URL with common parameters
 * @param {string} basePath - Base API path
 * @param {Object} [params] - Query parameters
 * @returns {string} Generic endpoint URL
 */
function buildGenericEndpoint(basePath, params = {}) {
  const queryParams = new URLSearchParams();

  // Add standard parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const query = queryParams.toString();
  return `${basePath}${query ? `?${query}` : ''}`;
}

/**
 * Gets all configured Commerce API endpoint paths
 * @param {Object} config - Configuration object
 * @returns {Object} Object containing all endpoint paths
 */
function getEndpointPaths(config) {
  return { ...config.commerce.paths };
}

/**
 * Validates an endpoint URL format
 * @param {string} endpoint - Endpoint URL to validate
 * @returns {boolean} True if endpoint format is valid
 */
function validateEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') {
    return false;
  }

  // Check for basic URL structure
  const urlPattern = /^\/[\w\-/?&=%.]+$/;
  return urlPattern.test(endpoint);
}

/**
 * Normalizes an endpoint URL by removing leading/trailing slashes and query duplicates
 * @param {string} endpoint - Endpoint URL to normalize
 * @returns {string} Normalized endpoint URL
 */
function normalizeEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') {
    return '';
  }

  // Remove trailing slash, preserve leading slash
  let normalized = endpoint.replace(/\/$/, '');

  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
}

module.exports = {
  buildProductsEndpoint,
  buildStockItemEndpoint,
  buildCategoryEndpoint,
  buildCategoryListEndpoint,
  buildAdminTokenEndpoint,
  buildCustomerEndpoint,
  buildOrderEndpoint,
  buildSearchEndpoint,
  buildGenericEndpoint,
  getEndpointPaths,
  validateEndpoint,
  normalizeEndpoint,
};
