/**
 * Commerce API endpoint URL builder
 * @module commerce/api/endpoint-builder
 * 
 * Provides functions to build Commerce API endpoint URLs using patterns
 * defined in the URL configuration. Each function handles parameter validation
 * and builds the complete URL for a specific endpoint type.
 */

const { buildCommerceUrl } = require('../../core/routing');

/**
 * Endpoint URL builder functions
 */
const endpoints = {
    // Authentication
    getAdminToken: () => buildCommerceUrl('adminToken'),

    // Products
    getProducts: (params = {}) => buildCommerceUrl('products', {
        pageSize: params.pageSize || 20,
        currentPage: params.currentPage || 1
    }),
    
    // Stock
    getStockItem: (sku) => buildCommerceUrl('stockItem', { sku }),
    
    // Categories
    getCategory: (id) => buildCommerceUrl('category', { id }),
    getCategoryList: (params = {}) => buildCommerceUrl('categoryList', {
        pageSize: params.pageSize || 20,
        currentPage: params.currentPage || 1
    })
};

module.exports = endpoints; 