/**
 * Commerce Shared - Endpoint Builders
 * Configuration-driven endpoint building utilities that require complete commerce configuration
 */

const { createUrlBuilders } = require('../../shared/routing/url-factory');

/**
 * Build query parameters using configuration patterns
 * @purpose Create Commerce API query parameters using configured patterns and defaults
 * @param {Object} params - Query parameters to build
 * @param {Object} config - Commerce configuration with query patterns
 * @returns {URLSearchParams} Configured query parameters
 * @usedBy All endpoint builders for consistent query parameter building
 */
function buildConfiguredQueryParams(params, config) {
  if (!config?.commerce) {
    throw new Error('Commerce configuration is required for query parameter building');
  }

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
  if (!config?.commerce?.queryPatterns?.search) {
    throw new Error('Commerce search patterns configuration is required');
  }

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
  if (!config?.commerce?.queryPatterns?.fields) {
    throw new Error('Commerce field patterns configuration is required');
  }

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
  if (!config) {
    throw new Error('Configuration is required for buildProductsEndpoint');
  }

  // Use URL factory for commerce URL building with products endpoint and parameters
  const { commerceUrl } = createUrlBuilders(config);
  return commerceUrl('products', params);
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
  if (!config) {
    throw new Error('Configuration is required for buildStockItemEndpoint');
  }

  const { commerceUrl } = createUrlBuilders(config);
  return commerceUrl('stockItem', {}, { sku });
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
  if (!config) {
    throw new Error('Configuration is required for buildCategoryEndpoint');
  }

  const { commerceUrl } = createUrlBuilders(config);
  return commerceUrl('category', {}, { id: categoryId });
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
  if (!config) {
    throw new Error('Configuration is required for buildCategoryListEndpoint');
  }

  // Use URL factory for category list URL building with parameters
  const { commerceUrl } = createUrlBuilders(config);
  return commerceUrl('categoryList', params);
}

/**
 * Build admin token endpoint URL with configuration
 * @purpose Create complete Commerce API URL for admin token generation using configuration
 * @param {Object} config - Application configuration with commerce settings
 * @returns {string} Complete admin token endpoint URL
 * @usedBy Admin token authentication workflows
 */
function buildAdminTokenEndpoint(config) {
  if (!config) {
    throw new Error('Configuration is required for buildAdminTokenEndpoint');
  }

  const { commerceUrl } = createUrlBuilders(config);
  return commerceUrl('adminToken');
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
};
