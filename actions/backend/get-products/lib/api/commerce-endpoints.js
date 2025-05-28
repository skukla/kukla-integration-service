/**
 * Adobe Commerce REST API endpoint definitions
 * @module lib/api/commerce-endpoints
 */

const { buildCommerceUrl } = require('../../../../../src/core/routing');

/**
 * Get products endpoint with pagination
 * @param {Object} options - Endpoint options
 * @param {number} [options.pageSize=20] - Number of products per page
 * @param {number} [options.currentPage=1] - Current page number
 * @returns {string} Products endpoint path
 */
function getProductsEndpoint(options = {}) {
    return buildCommerceUrl('products', {
        pageSize: options.pageSize || 20,
        currentPage: options.currentPage || 1
    });
}

/**
 * Get stock item endpoint for a specific SKU
 * @param {string} sku - Product SKU
 * @returns {string} Stock item endpoint path
 */
function getStockItemEndpoint(sku) {
    return buildCommerceUrl('stockItem', { sku });
}

/**
 * Get category endpoint for a specific category ID
 * @param {string} id - Category ID
 * @returns {string} Category endpoint path
 */
function getCategoryEndpoint(id) {
    return buildCommerceUrl('category', { id });
}

/**
 * Get admin token endpoint
 * @returns {string} Admin token endpoint path
 */
function getAdminTokenEndpoint() {
    return buildCommerceUrl('adminToken');
}

module.exports = {
    getProductsEndpoint,
    getStockItemEndpoint,
    getCategoryEndpoint,
    getAdminTokenEndpoint
}; 