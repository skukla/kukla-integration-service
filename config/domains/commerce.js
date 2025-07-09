/**
 * Commerce Domain Configuration
 * @module config/domains/commerce
 *
 * 🎯 Used by: All Commerce API integration actions
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
    api: {
      version: 'V1',
    },
    batching: {
      inventory: 50, // inventory batch size
      categories: 20, // categories batch size
    },
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
  };
}

module.exports = {
  buildCommerceConfig,
};
