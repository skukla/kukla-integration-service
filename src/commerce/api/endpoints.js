/**
 * Adobe Commerce API endpoint definitions
 * @module commerce/api/endpoints
 */

/**
 * Build endpoint path with optional query parameters
 * @private
 * @param {string} path - Base endpoint path
 * @param {Object} [params] - Query parameters
 * @returns {string} Full endpoint path
 */
function buildEndpoint(path, params = {}) {
    const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
    return queryString ? `${path}?${queryString}` : path;
}

/**
 * Commerce API endpoint definitions
 */
const endpoints = {
    // Authentication
    adminToken: () => '/V1/integration/admin/token',

    // Products
    products: (params = {}) => buildEndpoint('/V1/products', {
        searchCriteria: JSON.stringify({
            pageSize: params.pageSize || 20,
            currentPage: params.currentPage || 1
        })
    }),
    
    // Stock
    stockItem: (sku) => buildEndpoint(`/V1/stockItems/${encodeURIComponent(sku)}`),
    
    // Categories
    category: (id) => `/V1/categories/${id}`,
    categoryList: (params = {}) => buildEndpoint('/V1/categories', {
        searchCriteria: JSON.stringify({
            pageSize: params.pageSize || 20,
            currentPage: params.currentPage || 1
        })
    })
};

module.exports = endpoints; 