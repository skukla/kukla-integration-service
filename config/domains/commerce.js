/**
 * Commerce Domain Configuration
 * @module config/domains/commerce
 *
 * Used by: All Commerce API integration actions
 * ⚙️ Key settings: Commerce URL, API paths, OAuth settings, batching configuration
 *
 * 📋 Environment settings: Requires COMMERCE_BASE_URL from environment
 */

/**
 * Build commerce configuration
 * @param {Object} [params] - Action parameters for environment values
 * @returns {Object} Commerce configuration
 */
function buildCommerceConfig(params = {}) {
  // Get required values with clear descriptive fallbacks
  const baseUrl =
    params.COMMERCE_BASE_URL || process.env.COMMERCE_BASE_URL || 'REQUIRED:COMMERCE_BASE_URL';

  return {
    baseUrl,
    adminUsername: process.env.COMMERCE_ADMIN_USERNAME,
    adminPassword: process.env.COMMERCE_ADMIN_PASSWORD,

    /**
     * Token Management Configuration
     */
    tokenExpirationMs: 3 * 60 * 60 * 1000, // 3 hours default
    tokenRefreshBufferMs: 5 * 60 * 1000, // 5 minute buffer before expiration

    /**
     * API Configuration
     */
    api: {
      version: 'V1',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
    },

    /**
     * Batching Configuration
     */
    batching: {
      inventory: 50, // inventory batch size
      categories: 20, // categories batch size
    },

    /**
     * API Paths Configuration
     */
    paths: {
      products: '/products',
      categories: '/categories',
      customers: '/customers',
      orders: '/orders',
      adminToken: '/integration/admin/token',
      search: '/search',
      stockItems: '/stockItems', // inventory endpoint
      stockItem: '/stockItems', // alias for single item
      category: '/categories/:id', // single category endpoint
      categoryList: '/categories', // category list endpoint
    },

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
    },

    /**
     * Category Configuration
     */
    categories: {
      rootCategoryId: 1,
      includePath: true,
      includeChildren: false,
    },

    /**
     * Product Configuration
     */
    products: {
      includeInventory: true,
      includeCategories: true,
      includeImages: true,
      includeCustomAttributes: false,
    },
  };
}

module.exports = {
  buildCommerceConfig,
};
