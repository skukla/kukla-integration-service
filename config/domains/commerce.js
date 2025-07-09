/**
 * Commerce Domain Configuration
 * @module config/domains/commerce
 *
 * 🎯 Used by: Product Export (REST & Mesh methods)
 * ⚙️ Key settings: API timeouts, endpoints, caching, retry logic, batching
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
    api: {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      concurrency: 3,
    },
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 200,
    },
    batching: {
      inventory: 50,
      products: 100,
    },
    paths: {
      products: '/products',
      stockItem: '/inventory/source-items',
      category: '/categories/:id',
      categoryList: '/categories',
    },
    authentication: {
      maxRetries: 2,
      retryDelay: 1000,
    },
    caching: {
      duration: 1800, // 30 minutes
    },
  };
}

module.exports = {
  buildCommerceConfig,
};
