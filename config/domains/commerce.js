/**
 * Commerce Domain Configuration
 * @module config/domains/commerce
 *
 * Used by: All Commerce API integration actions
 * ⚙️ Key settings: Commerce URL, API paths, OAuth settings, batching configuration
 *
 * 📋 Environment settings: Requires COMMERCE_BASE_URL from environment
 */

const { getCommerceParameters } = require('../../src/shared/utils/parameters');

/**
 * Build commerce API configuration
 * @returns {Object} API configuration object
 */
function buildApiConfig() {
  return {
    version: 'V1',
    scope: 'all', // 'all' for multi-store, or 'default' for single store
    prefix: '/rest',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
  };
}

/**
 * Build commerce paths configuration
 * @returns {Object} API paths configuration object
 */
function buildPathsConfig() {
  return {
    // Product endpoints
    products: '/products',
    productSearch: '/products',

    // Category endpoints
    categories: '/categories',
    categoryList: '/categories/list',
    category: '/categories/:id',

    // Inventory endpoints
    stockItems: '/stockItems',
    stockItem: '/stockItems/:sku',

    // Authentication endpoints
    adminToken: '/integration/admin/token',

    // Customer endpoints
    customers: '/customers',

    // Order endpoints
    orders: '/orders',

    // Search endpoints
    search: '/search',
  };
}

/**
 * Build commerce query patterns configuration
 * @returns {Object} Query patterns configuration object
 */
function buildQueryPatternsConfig() {
  return {
    pagination: {
      pageSize: 'searchCriteria[pageSize]',
      currentPage: 'searchCriteria[currentPage]',
    },
    search: {
      filterGroupPrefix: 'searchCriteria[filter_groups]',
      fieldParam: 'field',
      valueParam: 'value',
      conditionParam: 'condition_type',
    },
    fields: {
      fieldsParam: 'fields',
      itemsWrapper: 'items[{fields}],total_count',
    },
  };
}

/**
 * Build commerce configuration
 * @param {Object} [params] - Action parameters for environment values
 * @returns {Object} Commerce configuration
 */
function buildCommerceConfig(params = {}) {
  const { baseUrl, adminUsername, adminPassword } = getCommerceParameters(params, {});

  return {
    baseUrl,
    adminUsername,
    adminPassword,

    /**
     * Token Management Configuration
     */
    tokenExpirationMs: 3 * 60 * 60 * 1000, // 3 hours default
    tokenRefreshBufferMs: 5 * 60 * 1000, // 5 minute buffer before expiration

    /**
     * API Configuration
     */
    api: buildApiConfig(),

    /**
     * Batching Configuration
     */
    batching: {
      inventory: 50, // inventory batch size
      categories: 20, // categories batch size
    },

    /**
     * API Paths Configuration - Base paths without REST prefix
     */
    paths: buildPathsConfig(),

    /**
     * Default Headers Configuration
     */
    defaultHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },

    /**
     * Pagination Configuration
     */
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 100,
      defaultCurrentPage: 1,
    },

    /**
     * Query Parameter Patterns - Commerce API specific patterns
     */
    queryPatterns: buildQueryPatternsConfig(),
  };
}

module.exports = {
  buildCommerceConfig,
};
