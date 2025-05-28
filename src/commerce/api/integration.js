/**
 * Adobe Commerce API integration
 * @module commerce/api/integration
 */

const { http: { buildHeaders } } = require('../../core');
const { makeRequest, batchRequests } = require('./client');

/**
 * Builds a Commerce API URL
 * @param {string} baseUrl - Base Commerce URL
 * @param {string} endpoint - API endpoint
 * @returns {string} Full URL
 */
function buildCommerceUrl(baseUrl, endpoint) {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}/rest${path}`;
}

/**
 * Makes a Commerce API request with commerce-specific handling
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} Response data
 */
async function makeCommerceRequest(url, options = {}, context = {}) {
    return makeRequest(url, {
        ...options,
        headers: {
            ...buildHeaders(),
            ...(options.headers || {})
        }
    }, context);
}

/**
 * Validates admin credentials against Adobe Commerce
 * @param {Object} params - Authentication parameters
 * @param {string} params.url - Commerce instance URL
 * @param {string} params.username - Admin username
 * @param {string} params.password - Admin password
 * @returns {Promise<Object>} Validation result
 */
async function validateAdminCredentials(params) {
    const url = buildCommerceUrl(params.url, '/V1/integration/admin/token');
    return makeCommerceRequest(url, {
        method: 'POST',
        body: JSON.stringify({
            username: params.username,
            password: params.password
        })
    }, {
        url,
        username: params.username
    });
}

/**
 * Batches multiple Commerce API requests with commerce-specific handling
 * @param {Array<Object>} requests - Array of request objects
 * @param {Object} options - Batch options
 * @returns {Promise<Array>} Array of responses
 */
async function batchCommerceRequests(requests, options = {}) {
    const commerceRequests = requests.map(req => ({
        ...req,
        options: {
            ...req.options,
            headers: {
                ...buildHeaders(),
                ...(req.options?.headers || {})
            }
        }
    }));
    return batchRequests(commerceRequests, options);
}

module.exports = {
    buildCommerceUrl,
    makeCommerceRequest,
    validateAdminCredentials,
    batchCommerceRequests
}; 