/**
 * Commerce Shared - Endpoint Builders
 * True configuration-driven endpoint building utilities that leverage commerce configuration for both URL building and query parameter patterns
 */

const { buildCommerceApiUrl } = require('../../shared/routing/commerce');

/**
 * Build query parameters using configuration patterns
 * @purpose Create Commerce API query parameters using configured patterns and defaults
 * @param {Object} params - Query parameters to build
 * @param {Object} config - Commerce configuration with query patterns
 * @returns {URLSearchParams} Configured query parameters
 * @usedBy All endpoint builders for consistent query parameter building
 */
function buildConfiguredQueryParams(params, config) {
  const queryParams = new URLSearchParams();
  const { queryPatterns, pagination } = config.commerce;

  // Add pagination using configuration patterns and defaults
  const pageSize = params.pageSize || pagination.defaultPageSize;
  const currentPage = params.currentPage || pagination.defaultCurrentPage;

  queryParams.append(queryPatterns.pagination.pageSize, pageSize);
  queryParams.append(queryPatterns.pagination.currentPage, currentPage);

  return queryParams;
}

/**
 * Add search criteria using configuration patterns
 * @purpose Add search filters using configured Commerce API patterns
 * @param {URLSearchParams} queryParams - Query parameters to modify
 * @param {string} searchTerm - Search term to add
 * @param {Object} config - Commerce configuration with search patterns
 * @usedBy Product search endpoints requiring configured search patterns
 */
function addConfiguredSearchCriteria(queryParams, searchTerm, config) {
  const { search } = config.commerce.queryPatterns;

  // Search in both name and SKU fields using configuration patterns
  const filterGroupBase = `${search.filterGroupPrefix}[0][filters]`;

  // Name search filter
  queryParams.append(`${filterGroupBase}[0][${search.fieldParam}]`, 'name');
  queryParams.append(`${filterGroupBase}[0][${search.valueParam}]`, `%${searchTerm}%`);
  queryParams.append(`${filterGroupBase}[0][${search.conditionParam}]`, 'like');

  // SKU search filter
  queryParams.append(`${filterGroupBase}[1][${search.fieldParam}]`, 'sku');
  queryParams.append(`${filterGroupBase}[1][${search.valueParam}]`, `%${searchTerm}%`);
  queryParams.append(`${filterGroupBase}[1][${search.conditionParam}]`, 'like');
}

/**
 * Add field selection using configuration patterns
 * @purpose Add field selection using configured Commerce API field patterns
 * @param {URLSearchParams} queryParams - Query parameters to modify
 * @param {Array<string>} fields - Fields to include
 * @param {Object} config - Commerce configuration with field patterns
 * @usedBy Product endpoints requiring specific field selection
 */
function addConfiguredFieldSelection(queryParams, fields, config) {
  const { fields: fieldPatterns } = config.commerce.queryPatterns;

  const itemFields = fields.join(',');
  const fieldsParam = fieldPatterns.itemsWrapper.replace('{fields}', itemFields);
  queryParams.append(fieldPatterns.fieldsParam, fieldsParam);
}

/**
 * Build complete products endpoint URL with configuration-driven query parameters
 * @purpose Create complete Commerce API URL for product fetching using configuration for all aspects
 * @param {Object} params - Query parameters for product endpoint
 * @param {number} [params.pageSize] - Number of items per page (uses config default if not provided)
 * @param {number} [params.currentPage] - Current page number (uses config default if not provided)
 * @param {string} [params.searchTerm] - Search term for product name/SKU
 * @param {Array<string>} [params.fields] - Specific fields to include
 * @param {Object} config - Application configuration with commerce settings
 * @returns {string} Complete product endpoint URL with configuration-driven query parameters
 * @usedBy Product fetching workflows requiring configuration-driven query building
 */
function buildProductsEndpoint(params = {}, config) {
  if (!config || !config.commerce?.baseUrl) {
    // Legacy mode: use configuration paths but simple URL building
    return buildLegacyProductsEndpoint(params, config);
  }

  // Step 1: Build base URL using configuration
  const baseUrl = buildCommerceApiUrl('products', config);

  // Step 2: Build query parameters using configuration patterns and defaults
  const queryParams = buildConfiguredQueryParams(params, config);

  // Step 3: Add search criteria if provided (using configuration patterns)
  if (params.searchTerm) {
    addConfiguredSearchCriteria(queryParams, params.searchTerm, config);
  }

  // Step 4: Add field selection if provided (using configuration patterns)
  if (params.fields && Array.isArray(params.fields) && params.fields.length > 0) {
    addConfiguredFieldSelection(queryParams, params.fields, config);
  }

  // Step 5: Combine URL with query parameters
  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Build simple endpoint URL from configuration paths (legacy helper)
 * @purpose Create basic endpoint URL using configuration paths without full URL building
 * @param {string} pathKey - Configuration path key
 * @param {Object} config - Configuration object (may be partial)
 * @param {Object} [pathParams] - Path parameters for substitution
 * @returns {string} Simple endpoint URL
 * @usedBy Legacy functions when full configuration not available
 */
function buildSimpleEndpointFromConfig(pathKey, config, pathParams = {}) {
  // Try to get configuration, fall back to minimal defaults
  const commerce = config?.commerce || {};
  const api = commerce.api || { version: 'V1', prefix: '/rest' };
  const paths = commerce.paths || {
    products: '/products',
    stockItem: '/stockItems/:sku',
    category: '/categories/:id',
    categoryList: '/categories/list',
    adminToken: '/integration/admin/token',
  };

  let path = paths[pathKey] || `/${pathKey}`;

  // Replace path parameters if provided
  Object.entries(pathParams).forEach(([key, value]) => {
    path = path.replace(`:${key}`, encodeURIComponent(value));
  });

  return `${api.prefix}/${api.version}${path}`;
}

/**
 * Build stock item endpoint URL with configuration
 * @purpose Create complete Commerce API URL for inventory data fetching using configuration
 * @param {string} sku - Product SKU
 * @param {Object} config - Application configuration with commerce settings
 * @returns {string} Complete stock item endpoint URL
 * @usedBy Inventory enrichment workflows
 */
function buildStockItemEndpoint(sku, config) {
  if (!config || !config.commerce?.baseUrl) {
    // Legacy mode: use configuration paths but simple URL building
    return buildSimpleEndpointFromConfig('stockItem', config, { sku });
  }

  return buildCommerceApiUrl('stockItem', config, { sku });
}

/**
 * Build category endpoint URL with configuration
 * @purpose Create complete Commerce API URL for category data fetching using configuration
 * @param {number} categoryId - Category ID
 * @param {Object} config - Application configuration with commerce settings
 * @returns {string} Complete category endpoint URL
 * @usedBy Category enrichment workflows
 */
function buildCategoryEndpoint(categoryId, config) {
  if (!config || !config.commerce?.baseUrl) {
    // Legacy mode: use configuration paths but simple URL building
    return buildSimpleEndpointFromConfig('category', config, { id: categoryId });
  }

  return buildCommerceApiUrl('category', config, { id: categoryId });
}

/**
 * Build category list endpoint URL with configuration-driven query parameters
 * @purpose Create complete Commerce API URL for category list using configuration defaults
 * @param {Object} params - Query parameters for category list
 * @param {number} [params.rootCategoryId] - Root category ID (uses config default if not provided)
 * @param {number} [params.depth] - Category tree depth
 * @param {Object} config - Application configuration with commerce settings
 * @returns {string} Complete category list endpoint URL with configuration-driven parameters
 * @usedBy Category fetching workflows
 */
function buildCategoryListEndpoint(params = {}, config) {
  if (!config || !config.commerce?.baseUrl) {
    // Legacy mode: use configuration paths but simple URL building
    return buildLegacyCategoryListEndpoint(params, config);
  }

  // Step 1: Build base URL using configuration
  const baseUrl = buildCommerceApiUrl('categoryList', config);

  // Step 2: Build query parameters using configuration defaults
  const queryParams = new URLSearchParams();

  // Use configuration default for root category if not provided
  const rootCategoryId = params.rootCategoryId || config.commerce.categories?.rootCategoryId;
  if (rootCategoryId) {
    queryParams.append('rootCategoryId', rootCategoryId);
  }

  if (params.depth) {
    queryParams.append('depth', params.depth);
  }

  // Step 3: Combine URL with query parameters
  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Build admin token endpoint URL with configuration
 * @purpose Create complete Commerce API URL for admin token generation using configuration
 * @param {Object} config - Application configuration with commerce settings
 * @returns {string} Complete admin token endpoint URL
 * @usedBy Admin token authentication workflows
 */
function buildAdminTokenEndpoint(config) {
  if (!config || !config.commerce?.baseUrl) {
    // Legacy mode: use configuration paths but simple URL building
    return buildSimpleEndpointFromConfig('adminToken', config);
  }

  return buildCommerceApiUrl('adminToken', config);
}

// Legacy Functions (for backward compatibility)

/**
 * Legacy product endpoint builder
 * @deprecated Use buildProductsEndpoint with config parameter
 */
function buildLegacyProductsEndpoint(params = {}, config = {}) {
  const queryParams = new URLSearchParams();

  if (params.pageSize) {
    queryParams.append('searchCriteria[pageSize]', params.pageSize);
  }

  if (params.currentPage) {
    queryParams.append('searchCriteria[currentPage]', params.currentPage);
  }

  const endpoint = buildSimpleEndpointFromConfig('products', config);
  const queryString = queryParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

/**
 * Legacy category list endpoint builder
 * @deprecated Use buildCategoryListEndpoint with config parameter
 */
function buildLegacyCategoryListEndpoint(params = {}, config = {}) {
  const queryParams = new URLSearchParams();

  if (params.rootCategoryId) {
    queryParams.append('rootCategoryId', params.rootCategoryId);
  }

  if (params.depth) {
    queryParams.append('depth', params.depth);
  }

  const endpoint = buildSimpleEndpointFromConfig('categoryList', config);
  const queryString = queryParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

module.exports = {
  // Main endpoint builders (configuration-driven)
  buildProductsEndpoint,
  buildStockItemEndpoint,
  buildCategoryEndpoint,
  buildCategoryListEndpoint,
  buildAdminTokenEndpoint,

  // Utility functions (configuration-driven)
  buildConfiguredQueryParams,
  addConfiguredSearchCriteria,
  addConfiguredFieldSelection,
  buildSimpleEndpointFromConfig,

  // Legacy functions (backward compatibility)
  buildLegacyProductsEndpoint,
  buildLegacyCategoryListEndpoint,
};
