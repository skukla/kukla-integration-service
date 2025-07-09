/**
 * Commerce Domain Configuration
 * @module config/domains/commerce
 */

/**
 * Build commerce configuration
 * @param {Object} params - Action parameters
 * @returns {Object} Commerce configuration
 */
function buildCommerceConfig(params = {}) {
  const commerceBaseUrl = params.COMMERCE_BASE_URL || process.env.COMMERCE_BASE_URL;

  return {
    baseUrl: commerceBaseUrl,
    timeout: 30000,
    paths: {
      products: '/products',
      stockItem: '/inventory/source-items',
      category: '/categories/:id',
      categoryList: '/categories',
    },
    caching: {
      duration: 1800, // 30 minutes
    },
  };
}

module.exports = {
  buildCommerceConfig,
};
