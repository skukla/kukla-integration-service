/**
 * Commerce Domain Configuration
 * @module config/domains/commerce
 *
 * 🎯 Used by: All Commerce API integration actions
 * ⚙️ Key settings: Commerce URL, API paths, OAuth settings, technical Commerce configuration
 *
 * 📋 Environment settings: Requires COMMERCE_BASE_URL from environment
 */

/**
 * Build commerce configuration
 * @param {Object} [params] - Action parameters for environment values
 * @param {Object} [mainConfig] - Shared main configuration (for future shared settings)
 * @returns {Object} Commerce configuration
 */
function buildCommerceConfig(params = {}, mainConfig = {}) {
  // Note: mainConfig available for future shared settings
  // eslint-disable-next-line no-unused-vars
  mainConfig;

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
