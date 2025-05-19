/**
 * Adobe Commerce API endpoints
 */
const endpoints = {
  products: {
    list: '/rest/V1/products',
    search: '/rest/V1/products/search',
    get: (sku) => `/rest/V1/products/${sku}`,
  },
  categories: {
    list: '/rest/V1/categories',
    get: (id) => `/rest/V1/categories/${id}`,
  },
  auth: {
    token: '/rest/V1/integration/admin/token',
  },
};

/**
 * Build a full Commerce API URL
 * @param {string} baseUrl - Commerce instance base URL
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full API URL
 */
function buildUrl(baseUrl, endpoint) {
  const url = new URL(endpoint, baseUrl);
  return url.toString();
}

module.exports = {
  endpoints,
  buildUrl,
}; 